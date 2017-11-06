
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
circletest();
