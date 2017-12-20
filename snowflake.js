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
            ctx.strokeStyle = "hsl(220, 5%, "+Math.floor(75+20/dist)+"%)";
            ctx.fillStyle = ctx.strokeStyle;
        }
        else {
            ctx.lineWidth = size/64;
            ctx.strokeStyle = "hsl(220, "+Math.floor(20+30/dist)+"%, "+Math.floor(30+40/dist)+"%)";
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

var BackgroundFlakes = function(size, count) {
    this.flakeSprites = [];
    this.size = size;
    this.xs = [];
    this.ys = [];
    this.spriteCount = 0;
    this.maxSprites = count; //TODO: Again, connect to performance.
    this.lastSprite = -100000;
    this.addDelay = 250;
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

BackgroundFlakes.prototype.resize = function() {
    
    var i;  
    var s;
    var sizeFactor;
    var newScale;
    var widthFactor = this.main.width / this.main.lastWidth;
    var heightFactor = this.main.height / this.main.lastHeight;
    for (i=0; i<this.spriteCount; ++i){
        //Change the scale
        s = this.flakeSprites[i]; 
        sizeFactor = this.main.globalScale/s.origGlobalScale;
        newScale = sizeFactor * s.origScale;
        s.scale.set(newScale,newScale);
        this.xs[i] *= widthFactor;  //Move the sprites around based on new size
        this.ys[i] *= heightFactor; 
        s.x = this.xs[i]; //TODO: This is gross, but perhaps find a way to do this better as far as interacting parts
        s.y = this.ys[i];
    }

}

BackgroundFlakes.prototype.update = function(time, delta){
    var i;
    if ((this.spriteCount < this.maxSprites) && (this.lastSprite + this.addDelay < time)) {
        var newSprite = new PIXI.Sprite(this.main.loader.resources["flake"].texture);    
        newSprite.anchor.set(0.5, 1); //Makes math just slightly easier.
        newSprite.x = Math.random()*this.main.width;
        newSprite.y = 0;
        this.flakeSprites.push(newSprite);
        this.container.addChild(newSprite);
        this.xs.push(newSprite.x);
        this.ys.push(newSprite.y);
        var scale = this.main.globalScale*this.size * (Math.random()*.25 + .75);
        newSprite.origScale = scale;
        newSprite.origGlobalScale = this.main.globalScale;
        newSprite.scale.set(scale,scale);
        this.spriteCount++;
        this.lastSprite = time;
        this.addDelay += (this.spriteCount/this.maxSprites) * 30 * Math.random()
    }


    var xOffsets = [];
    var yOffsets = [];
    var sizeDeltaScale = this.size*delta*this.main.globalScale;
    for (i=0; i<10; ++i) {
        xOffsets[i]=(this.main.wind.v * .65 + 0.85*(Math.random()-.5)/40*sizeDeltaScale);
        yOffsets[i]=((Math.random()/50+0.04)*sizeDeltaScale);
    }
    var xloop = Math.floor(Math.random()*5+5); //Will only go to 9 unless random == 1.0, which will almost surely never (probably just never) happen
    var yloop = Math.floor(Math.random()*6+5);
    var bottomEdge = Math.ceil(this.main.height+20*this.main.globalScale);
    var rightEdge = Math.ceil(this.main.width+20*this.main.globalScale);
    var leftEdge = -Math.ceil(this.main.globalScale*20);
    var loopDistance = Math.ceil(this.main.width+30*this.main.globalScale);
    //Seperating in hopes of greater efficiency
    for (i=0; i<this.spriteCount; ++i) {
        this.ys[i] += yOffsets[i%yloop];
    }
    for (i=0; i<this.spriteCount; ++i) {
        if (this.ys[i]>bottomEdge) {
            this.ys[i] -= bottomEdge + (1+Math.random())*this.main.globalScale*10; //This isn't perfect...
            this.xs[i] = Math.random()*this.main.width;
        }
    }
    for (i=0; i<this.spriteCount; ++i) {
        if (this.xs[i]> rightEdge) {this.xs[i] -= loopDistance;}
        if (this.xs[i]< leftEdge) {this.xs[i] += loopDistance;}
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

ForegroundFlakes.prototype.resize = function() {
    var i;
    var s;
    var scaleFactor = this.main.globalScale/this.main.lastScale;
    var widthFactor = this.main.width / this.main.lastWidth;
    var heightFactor = this.main.height / this.main.lastHeight;
    var newScale;
    var sizeFactor;
    for(i=0; i<this.flakes.length; ++i) {
        //This is a mess, but it's the 18th of December
        s = this.flakes[i];
        s.x *= widthFactor;
        s.y *= heightFactor;
        sizeFactor = this.main.globalScale/s.origGlobalScale;
        s.size = s.origSize*sizeFactor;
        newScale = sizeFactor;
        s.scale.set(newScale,newScale);
        //console.log(newScale);
        s.anchor.set(0.5,0.5)
    }
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
        var size = Math.round(this.main.globalScale*225/dist); //TODO: Better size picking function?

        //Now, find the index of the next smallest one to replace in the ordering, ordering larger to smaller
        for (i=0; i<this.flakes.length; ++i) {
            if (size < this.flakes[i].size) {
                break;
            }
        } //i is now the position to replace, provided everything's in order.
        var canvas = canvasDraw(size, dist);
        var newSprite = spriteFromCanvas(canvas); 
        delete canvas; //This probably won't help anything, but worth a shot.
        newSprite.x = Math.random()*this.main.width; //TODO: Width param in global
        newSprite.y = -size/2;
        newSprite.origGlobalScale = this.main.globalScale;
        newSprite.size = size;
        newSprite.origSize = size;
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
    // Update the position of the flakes on the screen
    for (i=0; i<len; ++i){
        this.flakes[i].x  += (0.8*this.main.wind.v + 0.2*this.flakes[i].windBias)*this.flakes[i].size * delta/1000 //Avg 1/2 flake width per second?
        this.flakes[i].y += (this.flakes[i].size*this.flakes[i].fallSpeed)*delta/1500; 
        this.flakes[i].rotation += this.flakes[i].dTheta*delta/1500;
    }
    // Bounds checking
    for (i=0; i<len; ++i){
        if (this.flakes[i].x < -this.flakes[i].size ){this.flakes[i].x += this.main.width + 1.5*this.flakes[i].size} 
        else if (this.flakes[i].x > this.main.width + this.flakes[i].size ) {this.flakes[i].x -= this.main.width + 1.5*this.flakes[i].size}
        else if (this.flakes[i].y > this.main.height + this.flakes[i].size/2) {  //Delete offscreen flake
            var oldFlake = this.container.removeChildAt(i)
            oldFlake.destroy({children:true, texture:true, baseTexture:true});
            this.flakes[i] = null;
            this.flakes.splice(i,1);
            this.flakeCount--;
            i--; len--;
        }
    }
}

var WindValGen = function() {
    return (sq(Math.random())-0.75)/0.75;  //Squaring to bias towards negatives, while allowing some rightward breezes
}

var WindTimeGen = function() {
    return 1500+4500*Math.random(); //TODO: Short times for testing. Might want to refine values and distro
}

var Wind = function(propertyName) {
    this.v = 0; //vel, between 0 and 1
    this.basetime = 0; //Base time for interpolation
    this.x1 = WindTimeGen(); //t0 rel time for t1
    this.x2 = WindTimeGen(); //t1 rel time for t2
    this.v0 = WindValGen();
    this.v1 = WindValGen();
    this.v2 = WindValGen();
    this.propertyName = propertyName ? propertyName : "wind";
}

Wind.prototype.setup = function(mainLoop) {
    mainLoop[this.propertyName] = this; //Assign the "wind" (or whatever) property of the main event loop
    return null;
}

function sq(x) {return x*x;}

Wind.prototype.update = function(time, delta) {
    while (time > this.basetime + this.x1) {
        this.basetime += this.x1;
        this.v0 = this.v1;
        this.x1 = this.x2;
        this.v1 = this.v2;
        this.x2 = WindTimeGen();
        this.v2 = WindValGen();
        //console.log(this.v2);
    }

    var t = time - this.basetime; 
    var t1 = this.x1;
    var t2 = this.x1 + this.x2;
    
    this.v =    this.v0 * (t - t1)/(t1) * (t-t2)/(t2) +  //Negatives cancel
                this.v1 * (t)/(t1) * (t-t2)/(t1-t2) +
                this.v2 * (t)/(t2) * (t-t1)/(t2-t1)

}

var BackgroundImage = function(name,image) {
    this.image = image;
    this.key=name;
    this.height=512; //Temp values to preserve sanity
    this.width = 1024;
}

BackgroundImage.prototype.setup=function(mainLoop) {
    this.main = mainLoop
    mainLoop.resources[this.key] = this.image; 
    mainLoop[this.key] = this; //Reference to BG image for position dependent layers
    this.container = new PIXI.Container();
    return this.container;
}

BackgroundImage.prototype.postLoad = function() {
    var texture = this.main.loader.resources[this.key].texture;
    this.bgimg = new PIXI.Sprite(texture);
    this.container.addChild(this.bgimg);
    this.tWidth = texture.width;
    this.tHeight = texture.height;
}

BackgroundImage.prototype.resize = function() {
    var scale = this.getScale();
    this.bgimg.scale.set(scale,scale);
    this.bgimg.x = this.getScreenX(0);
    this.bgimg.y = this.getScreenY(0);
    console.log(this.bgimg.x);
    console.log(scale);
}

//Efficiency isn't paramount here. Could cache these things after resize,
//but that could cause some TOU issues with the way things are dispatched,
//and really isn't very useful since these are only called during resize.
BackgroundImage.prototype.getScale = function() {
    var wF = this.main.width/this.tWidth;
    var hF = this.main.height/this.tHeight;
    return Math.max(wF, hF);
}

BackgroundImage.prototype.getScreenX = function (x) {
    var scale = this.getScale();
    var ratio = this.main.width/this.main.height;
    //r = 2: 0 offset.
    //r = 1: -this.main.width/2
    console.log(ratio);
    return x*scale + (ratio-2)*this.main.height;
}

BackgroundImage.prototype.getScreenY = function (y) {
    var scale = this.getScale();
    return y*scale;
}

var FlickeryLights = function(lights, key, texture) {
    this.lightsData = lights; //Array of [x,y,size] relative to bg image 
    this.textureName = key;
    this.texture = texture;
}

FlickeryLights.prototype.setup = function(mainLoop) {
    this.main = mainLoop;
    //backdrop may not be installed at this point
    this.container = new PIXI.particles.ParticleContainer(1000, {
        scale: true,
        position:true,
        rotation:false,
        uvs:false,
        alpha:true
    });
    var i;
    this.lights = [];
    this.colours = [0xFF0000,0xD5BE00,0x00FF00,0x0000FF, 0xFF00FF,0xFF7e00,0xFFFFFF];
    mainLoop.resources[this.textureName] = this.texture;

    return this.container;
}

FlickeryLights.prototype.postLoad = function () {
    var i;
    var sprite;
    for (i=0; i<this.lightsData.length; ++i) {
        sprite = new PIXI.Sprite(this.main.loader.resources[this.textureName].texture);
        this.lights.push(sprite);
        this.container.addChild(sprite);
        this.changeColour(i);
    }
    this.setupSizeScale();
}

FlickeryLights.prototype.setupSizeScale = function(i) {
    var sprite;
    var size;
    for (i=0; i<this.lights.length; ++i) {
        sprite = this.lights[i];
        size = this.main.backdrop.getScale()*this.lightsData[i][2];
        sprite.width = size;
        sprite.height = size;
        sprite.anchor.set(0.5,0.5);
        sprite.x = this.main.backdrop.getScreenX(this.lightsData[i][0]);
        sprite.y = this.main.backdrop.getScreenY(this.lightsData[i][1]);
        sprite.nextChange = -1000;
        console.log(sprite.x,sprite.y,sprite.width);
    }
}

FlickeryLights.prototype.changeColour = function (i) {
    var j = Math.floor(Math.random()*this.colours.length);
    this.lights[i].tint = this.colours[j];
}

FlickeryLights.prototype.update = function(time, delta) {
    for (i=0; i<this.lights.length; ++i) {
        if (time > this.lights[i].nextChange) {
            this.changeColour(i);
            this.lights[i].nextChange = time + (1+2*Math.random())*750;
        }
    }
}

FlickeryLights.prototype.resize = function() {
    this.setupSizeScale();
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
    this.realtime = 0;
    this.resolutionFactor = 1.0; //TODO: Make user adjustable, triggering resize
    //This is pretty gross. Should be handled a bit more in a DI way, but good enough for now.
    //May need to be changed if there's an intro
    this.renderer = PIXI.autoDetectRenderer(1024,512); //Will be changed by resize
    document.getElementById("graphicsSpace").appendChild(this.renderer.view);
    this.stage = new PIXI.Container();
}

//Add layers. Must be added back to front. Might add a addLayerAt method if needed.
//setup should return a container to add to stage, for consistent rendering order
MainAnimLoop.prototype.addLayer = function(obj) {
    var newContainer = obj.setup(this);
    if (newContainer) {
        this.stage.addChild(newContainer);
    }
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
    //TODO: Make andStart work?
    var that=this;
    var postLoad = function() { //This will be called, as you'd expect, after everything's been loaded
        //console.log("Postload function")
        that.realtime = Date.now();
        var i;
        for (i=0; i<that.layers.length; ++i) {
            //console.log(that.layers[i])
            if ("postLoad" in that.layers[i]) {
                that.layers[i].postLoad.call(that.layers[i]);
            }
        }
        that.loaded = true;
        that.resize(true);
        that.ticker.start();
    }
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
        this.loader.load(postLoad);
        this.loader.onError.add(function(error) {
            console.log("error...");
            console.log(error);
        })
    }
    else {
        postLoad(true);
    }
}


MainAnimLoop.prototype.stop = function() {
    this.ticker.stop();
}

MainAnimLoop.prototype.resize = function(first) {
    var minR = 1.0;
    var maxR = 2.0; //Based on background image applicable regions.
    var referenceWidth = 1024;
    var referenceHeight = 512;
    //Get view width and height
    var vW = document.documentElement.clientWidth;
    var vH = document.documentElement.clientHeight;

    //What aspect ratio would this give us, if we went full?
    var vR = vW/vH;

    var scale,width,height;
    //Scale is based on unaffected coord of bg image
    if (minR <= vR && vR <= maxR) {
        width = vW;
        height = vH;
        scale = height/referenceHeight;
    }
    else if (vR < minR) {
        width = vW; 
        height = vW; //Force square if too narrow
        scale = height/referenceHeight;
    }
    else { //vR > minR
        height = vH;
        width = 2*vH;
        scale = width/referenceWidth;
    }

    this.divWidth = Math.round(width);
    this.divHeight = Math.round(height);

    this.width = Math.round(this.resolutionFactor*width);
    this.height = Math.round(this.resolutionFactor*height);

    this.renderer.view.style.width = this.divWidth+"px";
    this.renderer.view.style.height = this.divHeight+"px";
    this.renderer.resize(this.width, this.height);

    this.globalScale = scale;
    if (first) { //Set to init value if first time through
        this.lastScale=this.globalScale; 
        this.lastWidth = this.width;
        this.lastHeight = this.height;
    }

    var i;
    for (i=0; i<this.layers.length; ++i) {
        if ("resize" in this.layers[i]) {this.layers[i].resize.call(this.layers[i], first);}
    }

    this.lastScale=this.globalScale; //Done resizing
    this.lastWidth = this.width;
    this.lastHeight = this.height;
    
}

MainAnimLoop.prototype.update = function() {
    var time = Date.now();
    var delta = time - this.realtime;
    if (delta>100) delta=100;
    this.time = this.time+delta;
    this.realtime = time;
    var i;
    for (i=0; i<this.layers.length; ++i) {
        if ("update" in this.layers[i]) {
            this.layers[i].update.call(this.layers[i], this.time,delta);
        }
    }
    this.renderer.render(this.stage);
}

var animLoop = new MainAnimLoop();
var foreground = new ForegroundFlakes();
var nearBackground = new BackgroundFlakes(0.8,50); 
var farBackground = new BackgroundFlakes(0.5,100);
//var tree = new Tree();
var wind = new Wind("wind");
var backdrop = new BackgroundImage("backdrop","backdrop.png");
var lights = new FlickeryLights(lightArray,"lights", "light.png");

animLoop.addLayer(backdrop);
animLoop.addLayer(lights);
animLoop.addLayer(farBackground);
animLoop.addLayer(nearBackground);
animLoop.addLayer(foreground);
animLoop.addLayer(wind);
animLoop.start();

var waitThenResize = (function() {
    var timeoutID = false;

    var inner = function() {
        if (timeoutID !== false) {return;}
        timeoutID = window.setTimeout(function() 
        {   
            timeoutID = false;
            animLoop.resize(false);
        }, 500);
    }

    return inner;
}) ();

window.addEventListener("resize", waitThenResize);

//testDraw(genSnowflakeMesh());

//canvas.addEventListener("click", addAndDraw);
