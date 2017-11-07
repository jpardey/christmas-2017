
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
        console.log(weights);
        console.log(edges);
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
        "getPoints":getPoints, 
        "getEdges":getEdges, 
        "getTriangulation":getTriangulation, 
        "getFullTriangulation":getFullTriangulation, 
        "getMST":getMST
    };
         
}

function sq(x) {return x*x}

triangulation = Triangulation([0,0],[0,500],[500,0]);

var addAndDraw = function(ev) {
    if (ev) {
        if (ev.layerX + ev.layerY > 500) {triangulation.addPoint([500-ev.layerY,500-ev.layerX]);}
        else triangulation.addPoint([ev.layerX, ev.layerY]); 
    }
    ctx.clearRect(0,0,canvas.width, canvas.height);
    var edges = triangulation.getEdges();
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
    //console.log("edges: " + edges.length);
    //console.log("points: " + points.length);
}

var theta = 2*Math.PI/12;
var sliceSin = Math.sin(theta);
var sliceCos = Math.cos(theta);
var sliceTan = Math.tan(theta);
var upperSlope = (1-sliceCos)/sliceSin;
function genSnowflakePoints(n, factor) {
    var li = [];
    var i;
    var p;
     
    for (i = 0; i<n; ++i) {
        do {
            p = [Math.random(), Math.random()];
            if (p[0] + p[1] > 1) {p = [1-p[0], 1-p[1]];}
            p = [p[0]*sliceTan, p[1]];
        } while ((p[0] > sliceSin) || p[1]<upperSlope*p[0]);
        p = [Math.round(p[0]*factor), Math.round(p[1]*factor)];
        li.push(p);
    //    triangulation.addPoint(p);
    //    addAndDraw();
    }
    return li;
}

canvas.addEventListener("click", addAndDraw);

var li = genSnowflakePoints(500, 500);
var i;
for (i = 0; i<li.length;++i) {
    triangulation.addPoint(li[i]);
}
addAndDraw();

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
