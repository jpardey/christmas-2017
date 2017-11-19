//Get new points array mirrored around the 30 deg CW axis 
function getMirrored30(points) {
    var i;
    mpoints = [];
    for (i=0; i<points.length; ++i) {
        var point = points[i]; //Rotate 60 CCW, then mirror around Y axis
        mpoints.push([- point[0]/2 + 0.8660254037844387*point[1], 0.8660254037844387*point[0] + point[1]/2]);
    }   
    return mpoints;
}

//Rotate points around 60 deg axis
function getRotated60(points) {
    var i;
    rpoints = [];
    for (i=0; i<points.length; ++i) {
        var point = points[i]; //Rotate 60 CCW
        rpoints.push([ point[0]/2 - 0.8660254037844387*point[1], 0.8660254037844387*point[0] + point[1]/2]);
    }   
    return rpoints;
}

//n: number of points within slice
//center: bool, draw center point?
//right: bool, draw right point?
//left: bool, draw left point?
var genSnowflakePoints = (function(){
    var theta = 2*Math.PI/12;
    var sliceSin = Math.sin(theta);
    var sliceCos = Math.cos(theta);
    var sliceTan = Math.tan(theta);
    var upperSlope = (1-sliceCos)/sliceSin;
    return function(n,center,right,left) {
        var li = [];
        var i;
        var p;
         
        for (i = 0; i<n; ++i) {
            do {
                p = [Math.random(), Math.random()];
                if (p[0] > p[1]) {p = [p[1], p[0]];}
                p = [p[0]*sliceTan, p[1]];
            } while ((p[0] > sliceSin) || p[1] < 0.1 || p[1]>1-upperSlope*p[0]);
            li.push(p);
        }

        if (center) {
            li.push([0,0]);
        }

        if (left) {
            li.push([0,Math.random()*0.7+0.3]);
        }

        if (right) {
            var y = Math.random()*0.7+0.3;
            li.push([sliceSin*y,sliceCos*y]);
        }

        return li;
    }
})();

var genSnowflakeMesh = function() {
    //First, pick a number of points between 5 and 10
    var n = 5+Math.floor(Math.random()*6);
    //Make that many points. Render it as a 512 x 512 (Later. Set factor to 256 for that. Might be a bit wider or narrower too?) 
    var s = Math.floor(Math.random()*9);
    var center_p = 1;
    var left_p = 1;
    var right_p = 1;
    switch (s){
        case 2:
        case 3: center_p = 0; break;
        case 4:
        case 5: left_p = 0; break;
        case 6: left_p = 0; //fallthrough
        case 7:
        case 8: right_p = 0; break;
            
    }

    var points = genSnowflakePoints(n,center_p,right_p,left_p);
    var i;

    var t = new Triangulation([-10,-10], [-10,10], [20,0]);

    t.addPoints(points); 
    
    points = t.getPoints(); //Probably not necessary, but ensures indexing identical
    return t;
}

var pickFlakeEdges = function(t) {
    var allEdges = t.getEdges(); //Returns an array
    var mstEdges = t.getMST(); //Returns a set. Inconsistent, but it works here.

    var chosenEdges = Array.from(mstEdges); //Start with mst
    var extraEdges = []
    var i;
    for (i=0; i<allEdges.length; ++i) {
        if (!mstEdges.has(i)){
            extraEdges.push(i);
        }
    }
    var n = extraEdges.length;
    for (i = 0; i<n; ++i) {
        //Pick approx 10% of edges not in MST
        if (Math.random() < 0.1) {chosenEdges.push(extraEdges[i]);}
    }

    return chosenEdges;
}

//Draw a snowflake on a canvas, creating a snowflake/canvas object
var canvasDraw = function(fullSize, dist) {
    //Now would be the time to generate a random seed, if the generator is replaced
    //TODO: transform this to have the mesh gen and translations etc in a webworker if possible.
    //Only draw in the main thread.
    
    canv = document.createElement('canvas');
    var t = genSnowflakeMesh();
    var edgeList = pickFlakeEdges(t);
    var edges = t.getEdges();
    var points = t.getPoints();
    var mirrored = getMirrored30(points);

    var allPoints = [];
    var size = fullSize - fullSize/16;
    var offset = fullSize/2 ; 
    allPoints.push(points);
    allPoints.push(mirrored);
    var i;
    for (i = 2; i < 12; ++i) {
        allPoints.push(getRotated60(allPoints[i-2]));
    }

    //var edgeSet = new Set(edgeList);
    var l;
    var a,b;
    var pass;
    var e;
    var rFactor = 2; //Relationship between line size and point circle radius. 2 is maximum for smooth ends. 
    canv.width = fullSize; 
    canv.height = fullSize;
    var ctx = canv.getContext('2d');
    for (pass = 0; pass<2; ++pass) {
        if (!pass) {
            ctx.lineWidth = size/16;
            ctx.strokeStyle = "hsl(250, 5%, "+Math.floor(75+20/dist)+"%)";
            ctx.fillStyle = ctx.strokeStyle;
        }
        else {
            ctx.lineWidth = size/64;
            ctx.strokeStyle = "hsl(250, "+Math.floor(40+30/dist)+"%, "+Math.floor(30+40/dist)+"%)";
            ctx.fillStyle = ctx.strokeStyle;
        }

        //Draw circle at each point, for each pass, matching radius of line
        for (i = 0; i<12; ++i) {
            var drawPoints = allPoints[i];
            for (l = 3; l<drawPoints.length; ++l) {
                ctx.beginPath();
                ctx.arc(drawPoints[l][0]*size/2 + offset, drawPoints[l][1]*size/2 + offset, ctx.lineWidth/rFactor, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        //Draw all lines
        ctx.beginPath();
        for (l = 0; l<edgeList.length; ++l) {
            for(i=0;i<12;++i) {
                e = edgeList[l];
                a = allPoints[i][edges[e][0]];
                b = allPoints[i][edges[e][1]];
                ctx.moveTo(a[0]*size/2 + offset, a[1]*size/2 + offset);
                ctx.lineTo(b[0]*size/2 + offset, b[1]*size/2 + offset);
            }
        }
        ctx.stroke();
    }
    return canv;
}

function spriteFromCanvas(c) {
    return new PIXI.Sprite(PIXI.Texture.fromCanvas(c));
}

var BackgroundFlakes = function() {
    this.flakeSprites = [];
    this.xs = [];
    this.ys = [];
    this.spriteCount = 0;
    this.maxSprites = 200; //TODO: Again, connect to performance.
    this.lastSprite = -100000;
}

BackgroundFlakes.prototype.setup = function(mainLoop){
    this.main = mainLoop;
    this.container = new PIXI.particles.ParticleContainer(1000, {
        scale: true,
        position:true,
        rotation:false,
        uvs:false,
        alpha:true
    });
    mainLoop.resources["flake"] = "flake16.png";
    return this.container;
}

BackgroundFlakes.prototype.update = function(time, delta){
    if (delta > 100) {delta = 100;}

    var i;
    if ((this.spriteCount < this.maxSprites) && (this.lastSprite + 120 < time)) {
        var newSprite = new PIXI.Sprite(this.main.loader.resources["flake"].texture);    
        newSprite.anchor.set(0.5, 1); //Makes math just slightly easier.
        newSprite.x = Math.random()*1024;
        newSprite.y = 0;
        this.flakeSprites.push(newSprite);
        this.container.addChild(newSprite);
        this.xs.push(newSprite.x);
        this.ys.push(newSprite.y);
        var scale = Math.random()*.75 + .25;
        newSprite.scale.set(scale,scale);
        this.spriteCount++;
        this.lastSprite = time;
    }


    var xOffsets = [];
    var yOffsets = [];
    for (i=0; i<10; ++i) {
        xOffsets[i]=((Math.random()-Math.random())/40*delta);
        yOffsets[i]=((Math.random()/50+0.05)*delta);
    }
    var xloop = Math.floor(Math.random()*5+5); //Will only go to 9 unless random == 1.0, which will almost surely never (probably just never) happen
    var yloop = Math.floor(Math.random()*6+5);
    //Seperating in hopes of greater efficiency
    for (i=0; i<this.spriteCount; ++i) {
        this.ys[i] += yOffsets[i%yloop];
    }
    for (i=0; i<this.spriteCount; ++i) {
        if (this.ys[i]>512+16) {
            this.ys[i] = 0;
            this.xs[i] = Math.random()*1024;
        }

    }
    for (i=0; i<this.spriteCount; ++i) {
        this.xs[i] += xOffsets[i%xloop];
    }
    for (i=0; i<this.spriteCount; ++i) {
        this.flakeSprites[i].x = this.xs[i];
        this.flakeSprites[i].y = this.ys[i];
    }

}



var ForegroundFlakes = function() {
    this.flakes = [];
    this.flakeCount = 0;
    this.lastFlake = -100000;
    this.maxFlakes = 10; //TODO: Connect to performance of system. Gobal settings and performance module?
}

ForegroundFlakes.prototype.setup = function(mainLoop) {
    this.main = mainLoop;
    this.time = Date.now();
    this.container = new PIXI.Container();
    return this.container;
}

ForegroundFlakes.prototype.update = function(time,delta){

    var i;
    if ((this.flakeCount < this.maxFlakes) && (this.lastFlake + 1500 < time)) {
        var dist = ((2*Math.random())+1);
        var size = 300/dist; //TODO: Better size picking function?
            //This will range between 256/3 and 256 px with a nice reciprocal slope. Should reflect flakes in a range of spaces.
        //Now, find the index of the next smallest one to replace in the ordering, ordering larger to smaller
        for (i=0; i<this.flakes.length; ++i) {
            if (size < this.flakes[i].size) {
                break;
            }
        } //i is now the position to replace, provided everything's in order.
        var canvas = canvasDraw(size, dist);
        var newSprite = spriteFromCanvas(canvas); 
        delete canvas; //This probably won't help anything, but worth a shot.
        newSprite.x = Math.random()*1024; //TODO: Width param in global
        newSprite.y = -size/2;
        newSprite.size = size;
        newSprite.rotation = 2*Math.PI*Math.random();
        newSprite.dTheta = (Math.random()-.5); //Angle to rotate per some time quantity.
        newSprite.anchor.set(0.5, 0.5);
        newSprite.fallSpeed = Math.random()/2+0.75; //Size relative fall rate per some time quantity
        newSprite.windBias = Math.random()-0.5; //TODO: Make global

        this.flakes.splice(i, 0, newSprite);
        this.container.addChildAt(newSprite, i);
        this.lastFlake = time;
        this.flakeCount++;
    }

    var len = this.flakes.length;
    for (i=0; i<len; ++i){
        this.flakes[i].x += (this.flakes[i].windBias)*this.flakes[i].size * delta/1000 //Avg 1/2 flake width per second?
        this.flakes[i].y += (this.flakes[i].size*this.flakes[i].fallSpeed)*delta/1500; 
        this.flakes[i].rotation += this.flakes[i].dTheta*delta/1000;
    }
    for (i=0; i<len; ++i){
        if (this.flakes[i].x < -this.flakes[i].size/2 || this.flakes[i].x >1024 + this.flakes[i].size/2 || this.flakes[i].y > 512 + this.flakes[i].size/2) {
            var oldFlake = this.container.removeChildAt(i)
            oldFlake.destroy({children:true, texture:true, baseTexture:true});
            this.flakes[i] = null;
            this.flakes.splice(i,1);
            this.flakeCount--;
            i--; len--;
        }
    }


}
    
var MainAnimLoop = function() {
    this.loader = new PIXI.loaders.Loader();
    this.loaded = false;
    this.layers = [];
    this.resources = {};
    this.ticker = new PIXI.ticker.Ticker();
    this.ticker.autostart = false; 
    this.ticker.add(this.update, this);
    this.frameDiv = document.getElementById("framecount");
    this.time = 0;

    //This is pretty gross. Should be handled a bit more in a DI way, but good enough for now.
    //May need to be changed if there's an intro
    this.renderer = PIXI.autoDetectRenderer(1024,512);
    document.getElementById("graphicsSpace").appendChild(this.renderer.view);
    this.stage = new PIXI.Container();
}

//Add layers. Must be added back to front. Might add a addLayerAt method if needed.
//setup should return a container to add to stage, for consistent rendering order
MainAnimLoop.prototype.addLayer = function(obj) {
    this.stage.addChild(obj.setup(this));
    this.layers.push(obj);
}

MainAnimLoop.prototype.start = function() {
    if (this.loaded) {
        this.ticker.start();
    }
    else {
        this.load(true);
    }
}

MainAnimLoop.prototype.load = function(andStart) {
    var key;
    var value;
    var isThereStuff = false;
    for (key in this.resources){
        if (this.resources.hasOwnProperty(key)){
            value = this.resources[key];
            this.loader.add(key, value);
            isThereStuff = true;
        }
    } 
    if (isThereStuff) {
        var that = this;
        this.loader.load(function() {
            that.loaded = true;
            that.ticker.start();
        });
        this.loader.onError.add(function() {
            console.log("error...");
        })
    }
    else {
        this.loaded=true;
        this.ticker.start();
    }
}

MainAnimLoop.prototype.stop = function() {
    this.ticker.stop();
}

MainAnimLoop.prototype.update = function() {
    var time = Date.now();
    var delta = time - this.time;
    this.time = time;
    var i;
    for (i=0; i<this.layers.length; ++i) {
        this.layers[i].update.call(this.layers[i], time,delta);
    }
    this.renderer.render(this.stage);
}

var animLoop = new MainAnimLoop();
var foreground = new ForegroundFlakes();
var background = new BackgroundFlakes();

//var loader = new PIXI.loaders.Loader();

animLoop.addLayer(background);
animLoop.addLayer(foreground);
//Also, the rest of the resources. Perhaps have as global so any layer can add to it?
animLoop.start();

//animLoop();


//testDraw(genSnowflakeMesh());

//canvas.addEventListener("click", addAndDraw);
