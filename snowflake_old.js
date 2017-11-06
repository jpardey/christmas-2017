//First, generate a few points in a triangle. Scale by sqrt 3
//Then, join points via MST
//Add exterior edges to connect to other parts.
//Then, rotate the whole thing

//Store graphs as adjacency lists
//Store distance matrix as triangular matrix

var Trimatrix = function() {
    this.data = [];
    //  i
    // ****
    // *x*  j
    // **
    // *
    // 
    // j(j+1)/2 + i
}

Trimatrix.prototype.set = function(i,j,v) {
    if (i <= j) {
        this.data[(j*j + j)/2 + i] = v; 
    }
    else {
        this.data[(i*i + i)/2 + j] = v; 
    }
}

Trimatrix.prototype.set = function(i,j) {
    if (j >= i) {
        return this.data[(j*j + j)/2 + i]; 
    }
    else {
        return this.data[(i*i + i)/2 + j]; 
    }
}

//Generates a list of points in scaled unirad triangle.
var trirand = function(n, sx) {
    var i;
    var arr=[];
    var a;
    var b;
    for (i=0; i<n; ++i) {
        a = Math.random(); b = Math.random();
        if (x < y) {
            arr[i] = [a*sx, b]
        }
        else {
            arr[i] = [b*sx, a]
        }
    }
}

//Graph of distance squared
var dsqGraph = function(points){
    var i,j,n;
    var G = new Trigraph();
    n = points.length;
    for (j=0; j < n; ++j){
        for (i=0; i < j-1; ++i) {
            G.set(i,j, points[i][0] * points[i][0] + points[i][1] * points[i][1]);
        }
        G.set(j,j,0); //For consistency.
    }
} 

//       0
//   1       2 
// 3   4   5   6 
// P = floor(i/2-1/2)
// L = 2i+1
// R = 2i+2

var Heap = function(){
    this.data = [];
}

Heap.prototype.push(k,v){
    var i = this.data.length; 
    var p = (i-1) >> 1;
    while (i>0 && (k > this.data[p][0])) {
        this.data[i] = this.data[p]; //"Swap data with "inserted" value 
        i = p;
        p = (i-1) >> 1;
    }
    this.data[i]=[k,v]
}

/* Find min, put into k,v 
* Grab a leaf, put into lk, lv
* while lk, lv smaller than a child, swap with smaller child
*
*
*/
Heap.prototype.pop(){
    var k, v, i, l, r, lv, lk, n = this.data.length;
    if (n > 0) { 
    k = this.data[0][0];
    v = this.data[0][1];
    lk = this.data[n][0];
    lv = this.data[n][1];
    
    n = n-1; 
    }

    return v
}

var triangulate = function (points) {
    // http://wiki.tcl.tk/14581

}
