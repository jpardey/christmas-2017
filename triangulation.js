//Simple Delaunay triangulation.
//All points as [x,y] arrays.
var Triangulation = (function () {
    function sq(x) {
        return x*x;
    }

    function Triangulation(ma, mb, mc) {
        this.points=[] ; 
        this.points.push(ma);
        this.points.push(mb);
        this.points.push(mc);
        this.triangles = [];
        this.triangles.push([0, 1, 2]); //list of list of verticies
    }

    //Simple determinent based method to tell if a point is in the circumcirle.
    //Computes:

    // | ADx     ADy     ADx^2 + ADy^2 |
    // | BDx     BDy     BDx^2 + BDy^2 |
    // | CDx     CDy     CDx^2 + CDy^2 |

    // which is positive iff D is in the circle and ABC is ordered counterclockwise.
    // I don't know why this works, but everyone says it does.

    // Could use a faster approximate test before the exact test? This seems fast enough, and keeps it simple.
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

    function MSTcompareFunc(a,b) {
        if (a[0] > b[0]) return 1;
        else if (a[0] === b[0]) return 0;
        else return -1;
    }

    Triangulation.prototype.getTriangulation = function() {
        var realTriangles = [];
        var i;
        var j;
        outer: for (i = 0; i<this.triangles.length; ++i) {
            for (j=0; j<3; ++j) {
                if (this.triangles[i][j] < 3) continue outer;
            } 
            realTriangles.push(this.triangles[i]);
        } 
        return realTriangles;
    }

    Triangulation.prototype.edgeCode = function(i,j) {
        return (i>j)? i*this.points.length+j : j*this.points.length+i;
    }

    Triangulation.prototype.getEdges = function () {
        var j;
        var k;
        var edges={};
        var edgecode;
        var a;
        var b;
        for (j=0;j<this.triangles.length;++j) {
            for (k = 0; k<3; ++k) {
                a = this.triangles[j][k];
                b = this.triangles[j][(k+1)%3]; //Next node
                if ((a < 3) || (b<3)) continue;
                edgecode = this.edgeCode(a,b); 
                edges[edgecode] = [a,b];  //Add verticies as value to reduce string ops slightly.
            } 
        }
        return Object.values(edges);
    }

    Triangulation.prototype.getMST = function() {
        var weights = [];
        var i;
        var edges = this.getEdges();
        for (i=0; i<edges.length; ++i) {
            //Interpreter should inline sq func, if we care.
            weights[i] = [(sq(this.points[edges[i][0]][0]-this.points[edges[i][1]][0]) + sq(this.points[edges[i][0]][1]-this.points[edges[i][1]][1])), i, edges[i]]
        } 
        weights.sort(MSTcompareFunc);
        var treeEdges = new Set(); //set of edge numbers
        var treeVerts = new Set([3]); //Pick "random" vertex

        var nextVert = -1;
        var nextEdge = -1;
        while(treeVerts.size < (this.points.length - 3)) {
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

    Triangulation.prototype.getPoints = function() {
        return this.points;
    }
    Triangulation.prototype.addPoints = function(li) {
        var i;
        for (i=0; i<li.length; ++i) {
            this.addPoint(li[i]);
        }
    }
    Triangulation.prototype.addPoint = function(point) { 
        var x = this.points.length; //New point id in list of triangles
        this.points.push(point); //Add added point to point list
        var badTries = []; //Start with no bad triangles. Bad var name I know. Stores index of triangle in triangles to remove.
        var j; //Index var
        var a;
        var b;
        for (j=0; j<this.triangles.length; ++j) {
            if (inCircumcircle(this.points[this.triangles[j][0]] , this.points[this.triangles[j][1]], this.points[this.triangles[j][2]], this.points[x])) {
                badTries.push(j);
                //get actual location from point array. If new point in the circumcircle, not Delaunay, add to bad triangles
            }
        }
        var poly = [];  //"Star shaped polygon" edges, as strings of form "ei,j" where i > j for an edge Eij (aka Eji).
        var edges = {};
        for (j=0;j<badTries.length;++j) {
            var k;
            for (k = 0; k<3; ++k) {
                a = this.triangles[badTries[j]][k];
                b = this.triangles[badTries[j]][(k+1)%3]; //Next node
                var edgecode = this.edgeCode(a,b); //Unique and identical string for each edge, orientation independent.
                    //Might be slow, but seems fast enough for our purposes.
                if (edges.hasOwnProperty(edgecode)) {edges[edgecode] = -1;} //If edge in list already, invalidate
                else {edges[edgecode] = [a,b];}  //Add verticies as value to reduce string ops slightly.
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
        for (j=0; j<this.triangles.length; ++j) {
            if (!(badTriesSet.has(j))) {
                goodTries.push(this.triangles[j]);
            }
        }
        this.triangles.length = 0; //Empty triangles
        for (j=0; j<goodTries.length; ++j) {
            this.triangles.push(goodTries[j]); //Add good triangles
        }
        //Add the new triangles, triangulating the star shaped polygon to new point x.
        for (j=0; j<poly.length; ++j) {
            e = poly[j];
            this.triangles.push([edges[e][0], edges[e][1], x]);
        }
    }
    return Triangulation;
})();
