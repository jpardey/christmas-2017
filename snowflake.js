
//generate n random points within suitable triangle
function genPoint(n){
    var li = [];
    var i;
    var p;
    for (i=0; i< n; ++i) {
        p =  [Math.random(), Math.random()];
        if (p[0] > p[1]) li.push(p); 
        else li.push([p[1], p[0]]);
    }
    return li;
}

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


//is point d in circumcircle defined by a, b, c?
function inCircumcircle(a, b, c, d) {
    var abx = b[0] - a[0]; 
    var bcx = c[0] - b[0]; 
    var aby = b[1] - a[1]; 
    var bcy = c[1] - b[1]; 
    var ccw = abx*bcy - aby*bcx; //Cross product of AB and BC. Positive if points in CCW order, negative otherwise
    var adx = d[0] - a[0];
    var bdx = d[0] - b[0];
    var cdx = d[0] - c[0];
    var ady = d[1] - a[1];
    var bdy = d[1] - b[1];
    var cdy = d[1] - c[1];

    var ad2 = ady*ady + adx*adx;
    var bd2 = bdy*bdy + bdx*bdx;
    var cd2 = cdy*cdy + cdx*cdx;

    var detn = adx*bdy*cd2 + cdx*ady*bd2 + bdx*cdy*ad2 - adx*cdy*bd2 - bdx*ady*cd2 - cdx*bdy*ad2;
    //console.log(detn);
    return (ccw > 0) ? (detn > 0) : (detn < 0);
}

function pointOnCircle(origin, radius) {
    var angle = Math.random()*2*Math.PI;
    return [origin[0]+radius*Math.cos(angle), origin[1]+radius*Math.sin(angle)];
}

var canvas = document.getElementById("dotdemo");
var ctx = canvas.getContext("2d");

function Triangulation(ma, mb, mc) {
    var points=[] ; 
    var i; 
    points.push(ma);
    points.push(mb);
    points.push(mc);
    var triangles = [];
    triangles.push([0, 1, 2]); //list of list of verticies

    var getFullTriangulation = function () {
        return triangles;
    }
    
    //Get the triangulation without points 0, 1, 2
    var getTriangulation = function() {
        var realTriangles = [];
        var i;
        var j;
        outer: for (i = 0; i<triangles.length; ++i) {
            for (j=0; j<3; ++j) {
                if (triangles[i][j] < 3) continue outer;
                //TODO: This is wrong. Ends up with concave exteriors in some cases.
                // Removing a corner may need to add new edge between points on hull
            } 
            realTriangles.push(triangles[i]);
        } 
        return realTriangles;
    }

    //Get each unique edge from triangulation
    var getEdges = function () {
        var j;
        var edges={};
        for (j=0;j<triangles.length;++j) {
            var k;
            for (k = 0; k<3; ++k) {
                var a = triangles[j][k];
                var b = triangles[j][(k+1)%3]; //Next node
                if ((a < 3) || (b<3)) continue;
                //TODO: This is wrong. See getTriangulation
                var edgestr = (a>b)? "e"+a+","+b: "e"+b+","+a; //Unique and identical string for each edge, orientation independent.
                    //Might be slow, but seems fast enough for our purposes.
                edges[edgestr] = [a,b];  //Add verticies as value to reduce string ops slightly.
            } 
        }
        return Object.values(edges);
    }
    
    var getFullEdges = function () {
        var j;
        var edges={};
        for (j=0;j<triangles.length;++j) {
            var k;
            for (k = 0; k<3; ++k) {
                var a = triangles[j][k];
                var b = triangles[j][(k+1)%3]; //Next node
               // if ((a < 3) || (b<3)) continue;
                var edgestr = (a>b)? "e"+a+","+b: "e"+b+","+a; //Unique and identical string for each edge, orientation independent.
                    //Might be slow, but seems fast enough for our purposes.
                edges[edgestr] = [a,b];  //Add verticies as value to reduce string ops slightly.
            } 
        }
        return Object.values(edges);
    }

    function compareFunc(a,b) {
        if (a[0] > b[0]) return 1;
        else if (a[0] === b[0]) return 0;
        else return -1;
    }
    //Returns edges of MST. Might not belong here, but whatever.
    //Not a great implementation of MST (half-hearted Prim's), but for most reasonable cases,
    //more complex data structures required for proper implementations would likely
    //perform worse than built in JS arrays.

    //WARNING: Might not generate a full tree if identical points added.
    var getMST = function() {
        var weights = [];
        var i;
        var edges = getEdges();
        for (i=0; i<edges.length; ++i) {
            //Interpreter should inline sq func, if we care.
            weights[i] = [(sq(points[edges[i][0]][0]-points[edges[i][1]][0]) + sq(points[edges[i][0]][1]-points[edges[i][1]][1])), i, edges[i]]
        } 
        weights.sort(compareFunc);
        var treeEdges = new Set(); //set of edge numbers
        var treeVerts = new Set([3]); //Pick "random" vertex

        var nextVert = -1;
        var nextEdge = -1;
        while(treeVerts.size < (points.length - 3)) {
            //Iterate over edges to find one with a root in treeVerts
            for (i = 0; i < weights.length; ++i) {
                if (treeVerts.has(weights[i][2][0]) )  {
                    if (!treeVerts.has(weights[i][2][1])) {
                        nextVert = weights[i][2][1];    
                        nextEdge = weights[i][1];
                        weights.splice(i,1);
                        break;
                    }
                }
                else if (treeVerts.has(weights[i][2][1])) {
                    //We already know weights[i][2][0] is not in treeVerts
                    nextVert = weights[i][2][0];    
                    nextEdge = weights[i][1];
                    weights.splice(i,1);
                    break;
                }
            }
            if (nextVert<0 || treeVerts.has(nextVert)) {
                //Technically this is an error, I believe in triangulation and
                //edges. However, if true trees aren't critical, this won't hurt.
                //However, it seems to work fine
                //console.log("MST warning: Could not find next point.");
                break;
            }
            treeEdges.add(nextEdge);
            treeVerts.add(nextVert);
        }
        return treeEdges;
    }

    //Returns points, including ma, mb, mc, since I don't want to fix the indexing.
    var getPoints = function() {
        return points;
    }
    //Add points to the actual triangulation

    var addPoints = function(li) {
        var i;
        for (i=0; i<li.length; ++i) {
            addPoint(li[i]);
        }
    }

    //WARNING: Overlapping points may not be added properly.
    var addPoint = function(point) { 
        var x = points.length; //New point id in list of triangles
        points.push(point); //Add added point to point list
        badTries = []; //Start with no bad triangles. Bad var name I know. Stores index of triangle in triangles to remove.
        var j; //Index var
        for (j=0; j<triangles.length; ++j) {
            if (inCircumcircle(points[triangles[j][0]] , points[triangles[j][1]], points[triangles[j][2]], points[x])) {
                badTries.push(j);
                //get actual location from point array. If new point in the circumcircle, not Delaunay, add to bad triangles
            }
        }
        var poly = [];  //"Star shaped polygon" edges, as strings of form "ei,j" where i > j for an edge Eij (aka Eji).
        edges = {};
        for (j=0;j<badTries.length;++j) {
            var k;
            for (k = 0; k<3; ++k) {
                var a = triangles[badTries[j]][k];
                var b = triangles[badTries[j]][(k+1)%3]; //Next node
                var edgestr = (a>b)? "e"+a+","+b: "e"+b+","+a; //Unique and identical string for each edge, orientation independent.
                    //Might be slow, but seems fast enough for our purposes.
                if (edges.hasOwnProperty(edgestr)) {edges[edgestr] = -1;} //If edge in list already, invalidate
                else {edges[edgestr] = [a,b];}  //Add verticies as value to reduce string ops slightly.
            } 
        }
        var e;
        for (e in edges) {
            if (edges.hasOwnProperty(e) && (edges[e] !== -1)) {
                poly.push(e); //Any edge seen only once will be part of the enclosing triangle
            }
        }
        var goodTries = []; // Triangles to preserve. Of course it would be possible to avoid this step
            // and directly remove bad triangles, but that gets complex
        var badTriesSet = new Set(badTries);
        for (j=0; j<triangles.length; ++j) {
            if (!(badTriesSet.has(j))) {
                goodTries.push(triangles[j]);
            }
        }
        triangles.length = 0; //Empty triangles
        for (j=0; j<goodTries.length; ++j) {
            triangles.push(goodTries[j]); //Add good triangles
        }
        //Add the new triangles, triangulating the star shaped polygon to new point x.
        for (j=0; j<poly.length; ++j) {
            e = poly[j];
            triangles.push([edges[e][0], edges[e][1], x]);
        }
    }

    return {
        "addPoint":addPoint, 
        "addPoints":addPoints, 
        "getPoints":getPoints, 
        "getEdges":getEdges, 
        "getFullEdges":getFullEdges, 
        "getTriangulation":getTriangulation, 
        "getFullTriangulation":getFullTriangulation, 
        "getMST":getMST
    };
         
}

function sq(x) {return x*x}

triangulation = Triangulation([-2000,-2000],[-2000,15000],[15000,-2000]);

//Take a triangulation and draw it
var testDraw = function(t, edgeList, offset_x, offset_y, size) {
    //ctx.clearRect(0,0,canvas.width, canvas.height);
    var edges = t.getEdges();
    var points = t.getPoints();
    var mirrored = getMirrored30(points);

    var allPoints = [];
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
    for (pass = 0; pass<2; ++pass) {
        if (!pass) {
            ctx.lineWidth = size/32;
            ctx.strokeStyle = "#BBBBBB";
            ctx.fillStyle = "#BBBBBB";
        }
        else {
            ctx.lineWidth = size/64;
            ctx.strokeStyle = "#222277";
            ctx.fillStyle = "#222277";
        }


        //Draw circle at each point
        for (i = 0; i<12; ++i) {
            var drawPoints = allPoints[i];
            for (l = 3; l<drawPoints.length; ++l) {
                ctx.beginPath();
                ctx.arc(drawPoints[l][0]*size + offset_x, drawPoints[l][1]*size + offset_y, ctx.lineWidth/2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        for (l = 0; l<edgeList.length; ++l) {
            for(i=0;i<12;++i) {
                e = edgeList[l];
                a = allPoints[i][edges[e][0]];
                b = allPoints[i][edges[e][1]];
                ctx.beginPath();
                ctx.moveTo(a[0]*size + offset_x, a[1]*size + offset_y);
                ctx.lineTo(b[0]*size + offset_x, b[1]*size + offset_y);
                ctx.stroke();
            }
        }
    }

}

var addAndDraw = function(ev) {
    if (ev) {
        if (ev.layerX + ev.layerY > 500) {triangulation.addPoint([500-ev.layerY,500-ev.layerX]);}
        else triangulation.addPoint([ev.layerX, ev.layerY]); 
    }
    var edges = triangulation.getFullEdges();
    var points = triangulation.getPoints();
    var MST = triangulation.getMST();
    var l;
    var a,b;
    for (l = 0; l<edges.length; ++l) {
        if (MST.has(l)) {
            ctx.strokeStyle="#00FF00";
            ctx.lineWidth=2.5;
        }
        else {
            ctx.strokeStyle =  "#000000";
            ctx.lineWidth=1.0;
        }
        a = points[edges[l][0]];
        b = points[edges[l][1]];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
    }
    ctx.lineWidth=1.0;
    ctx.fillStyle = "#FF0000";
    ctx.lineStyle =  "#FF0000";
    for (l = 3; l<points.length; ++l) {
        ctx.beginPath();
        ctx.arc(points[l][0], points[l][1], 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

var theta = 2*Math.PI/12;
var sliceSin = Math.sin(theta);
var sliceCos = Math.cos(theta);
var sliceTan = Math.tan(theta);
var upperSlope = (1-sliceCos)/sliceSin;

//n: number of points within slice
//center: bool, draw center point?
//right: bool, draw right point?
//left: bool, draw left point?
var genSnowflakePoints = function(n,center,right,left) {
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

//Inputs: nothing
//Outputs: triangulation object (TODO: Should it be global, or generated, or optionally passed in?)
var genSnowflakeMesh = function() {
    //First, pick a number of points between 5 and 10
    var n = 5+Math.floor(Math.random()*6);
    //Make that many points. Render it as a 512 x 512 (Later. Set factor to 256 for that. Might be a bit wider or narrower too?) 
    var s = Math.floor(Math.random()*4);
    var center_p = 1;
    var left_p = 1;
    var right_p = 1;
    switch (s){
        case 1: center_p = 0; break;
        case 2: left_p = 0; break;
        case 3: right_p = 0; break;
            
    }

    var points = genSnowflakePoints(n,center_p,right_p,left_p);
    var i;

    var t = Triangulation([-10,-10], [-10,10], [20,0]);

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


var lastFlake = -100;
var now = 0;
var flakes = [];
var flakeCount = 0;
var animLoop = function() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    now++; 
    var i;
    if ((flakeCount < 5) && (lastFlake + 90 < now)){
        lastFlake = now; 
        var newFlake = genSnowflakeMesh();
        var newFlakeEdges = pickFlakeEdges(newFlake);
        for (i=0; i<5; ++i) {
            if (!flakes[i]) {
                flakes[i] = [newFlake, newFlakeEdges, Math.random()*512, -100, Math.random()+0.5];
                flakeCount++;
                break;
            }
        }
    }

    for (i=0; i<5; ++i) {
        var size;
        if (flakes[i]) {
            switch (i) {
                case 0:
                    size = 60;
                    break;
                case 1:
                    size = 64;
                    break;
                case 2:
                    size = 80;
                    break;
                case 3:
                    size = 90;
                    break;
                case 4:
                    size = 100;
                    break;
            }
            testDraw(flakes[i][0], flakes[i][1], flakes[i][2], flakes[i][3], size);

            flakes[i][2] += (Math.random()-0.5)*size/128;
            flakes[i][3] += size/128*flakes[i][4];

            if (flakes[i][2] < -size - 50 || flakes[i][2] >512 + size + 50 || flakes[i][3] > 512 + size) {
                flakes[i] = null;
                flakeCount--;
            }
        }
    }




    requestAnimationFrame(animLoop);
}

animLoop();

//testDraw(genSnowflakeMesh());

//canvas.addEventListener("click", addAndDraw);
/*
var li = genSnowflakePoints(500, 500);
var i;
for (i = 0; i<li.length;++i) {
    triangulation.addPoint(li[i]);
}
addAndDraw();
*/
function circletest() {
    var canvas = document.getElementById("dotdemo");
    var ctx = canvas.getContext("2d");
    var origin = [canvas.width*.5 + canvas.width*.25*Math.random(),canvas.height/2 +canvas.height*.25*Math.random()];
    var radius = Math.min(canvas.height, canvas.width)/8*(1+Math.random());
    //ctx.beginPath();
    //ctx.arc(origin[0], origin[1], radius, 0, 2*Math.PI);
    //ctx.stroke();
    var i; 
    var points = [];
    var indicator = document.getElementById("indicator");
    for (i=0; i<3; ++i) {
        points.push(pointOnCircle(origin, radius));
        ctx.beginPath();
        ctx.fillRect(points[i][0] - 2, points[i][1] - 2, 4, 4 );
        ctx.stroke();
    }

    function pick(ev){
        var d = [ev.layerX, ev.layerY];
        if (inCircumcircle(points[0], points[1], points[2], d)){
            ctx.fillStyle = "#00FF00";
            ctx.strokeStyle = "#00FF00";
        }
        else {
            ctx.fillStyle = "#FF0000";
            ctx.strokeStyle = "#FF0000";
        }
            ctx.beginPath();
            ctx.fillRect(d[0]-2, d[1]-2, 4, 4);
            ctx.stroke();
    }

    canvas.addEventListener("mousemove", pick);

}
//circletest();
