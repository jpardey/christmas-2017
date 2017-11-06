
//generate n random points within suitable triangle
function genPoint(n){
    var li = [];
    var i;
    for (i=0; i< n; ++i) {
        li.push([Math.random(), Math.random()]) ;
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

function triangulationTest() {
    var canvas = document.getElementById("dotdemo");
    var ctx = canvas.getContext("2d");
    var points = genPoint(10);
    var i; 
    var len = points.length;
    for (i=0; i<len; ++i) {
        if (points[i][0] > points[i][1]) {
            points[i] = [points[i][1], points[i][0]];
        }
        points[i][0] *= 400;
        points[i][1] *= 400;
        points[i][0] = Math.round(points[i][0]);
        points[i][1] = Math.round(points[i][1]);
        points[i][0] += 50;
        points[i][1] += 50;
    } 

    points.push([0,0]);
    points.push([500,0]);
    points.push([0,500]);
    var triangles = [];
    triangles.push([len, len+1, len+2]);
    var addPoint = function(x) { 
    //    var i;
    //    for (i = 0; i<len; ++i) {
            badTries = [];
            var j;
            for (j=0; j<triangles.length; ++j) {
                if (inCircumcircle(points[triangles[j][0]] , points[triangles[j][1]], points[triangles[j][2]], points[x])) {
                    badTries.push(j);
                    console.log("Pushed " + j + " into bad triangles");
                }
            }
            console.log("bad triangles:");
            console.log(badTries);
            console.log(triangles);
            
            var poly = []; //THIS IS WRONG. Poly is not necessarily star shaped!
            edges = {};
            for (j=0;j<badTries.length;++j) {
                var k;
                for (k = 0; k<3; ++k) {
                    var a = triangles[badTries[j]][k];
                    var b = triangles[badTries[j]][(k+1)%3];
                    var edgestr = (a>b)? "e"+a+","+b: "e"+b+","+a;
                    if (edges.hasOwnProperty(edgestr)) {edges[edgestr] = -1;}
                    else {edges[edgestr] = [a,b];}
                } 
            }
            var e;
            for (e in edges) {
                if (edges.hasOwnProperty(e) && (edges[e] !== -1)) {
                    poly.push(e);
                }
            }
            console.log("Poly size: " + poly.length)
            var goodTries = [];
            var badTriesSet = new Set(badTries);
            for (j=0; j<triangles.length; ++j) {
                if (!(badTriesSet.has(j))) {
                    goodTries.push(triangles[j]);
                }
            }
            console.log("good triangles:");
            console.log(goodTries);
            triangles.length = 0;
            for (j=0; j<goodTries.length; ++j) {
                triangles.push(goodTries[j]);
            }
            console.log("triangles, edges, polygons")
            console.log(triangles);
            console.log(edges);
            console.log(poly);

            for (j=0; j<poly.length; ++j) {
                e = poly[j];
                triangles.push([edges[e][0], edges[e][1], x]);
                console.log("New triangle:");
                console.log([edges[e][0], edges[e][1], x]);
            }
       // }
    }

    var l;
        console.log(triangles.length); 
    for (l = 0; l<len; ++l) {
        console.log("Adding point " + l);
        addPoint(l);
        console.log(triangles.length); 
    }
    for (l = 0; l<triangles.length; ++l) {
        a = points[triangles[l][0]];
        b = points[triangles[l][1]];
        c = points[triangles[l][2]];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.lineTo(a[0], a[1]);
        ctx.stroke();
    }

         
}

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
triangulationTest();
//circletest();
