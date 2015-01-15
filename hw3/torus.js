/*
David Parrott
david.m.parrott@wsu.edu
CS 442 Toroidal Spiral
Fall 2014
*/

//helper functions to easily calculate the derivatives
function x_t(a, b, q, p, t){
	return ((a + b * Math.cos(q * t))*Math.cos(p*t));
}
function y_t(a, b, q, p, t){
	return ((a + b * Math.cos(q * t))*Math.sin(p*t));
}
function z_t(b, q, t){
	return b * Math.sin(q*t);
}
function dx_t(a, b, q, p, t){
	return -p*y_t(a, b, q, p, t) - b*q*Math.sin(q*t)*Math.cos(p*t);
}
function dy_t(a, b, q, p, t){
	return p*x_t(a, b, q, p, t) - b*q*Math.sin(q*t)*Math.sin(p*t);
}
function dz_t(b, q, t){
	return b*q*Math.cos(q*t);
}
function d_dx_t(a, b, q, p, t){
	return -p*dy_t(a, b, p, q, t) + 
			b*q*(p*Math.sin(q*t)*Math.sin(p*t) -
			q*Math.cos(q*t)*Math.cos(p*t));
}
function d_dy_t(a, b, q, p, t){
	return p*dx_t(a, b, p, q, t) - 
			b*q*(p*Math.sin(q*t)*Math.cos(p*t) +
			q*Math.cos(q*t)*Math.sin(p*t));
}
function d_dz_t(b, q, t){
	return -(q*q)*b*Math.sin(q*t);
}

//even though it's not a torus anymore.....
var torus = { 
    N: 100,
    M: 80,
    a: 3.0,
    b: 1.5,
    R: 0.5,
    p: 3,
    q: 8,

    verts : null,
    normals : null,
    spineVerts : null,
    texCoords : null,

//creates the spine
//not used except to demonstrate that I did it
    createSpine : function(){
    	var N = this.N;
    	var a = this.a;
    	var b = this.b;
    	var p = this.p;
    	var q = this.q;
    	this.spineVerts = N + 1; 
    	var numFloats = (N + 1) * 3;
    	this.spine = new Float32Array(numFloats);
    	var n = 0;
    	var dt = 2*Math.PI/N;
    	for (var i = 0, t = 0.0; i <= N; i++, t += dt) {
    		if(i == N){t = 0.0;}
    		this.spine[n++] = x_t(a, b, q, p, t);
    		this.spine[n++] = y_t(a, b, q, p, t);
    		this.spine[n++] = z_t(b, q, t);
    	}
    },
//makes the toroidal spiral
    createGeometry : function() {
    	//screate variables from appropriate values
		var N = this.N, M = this.M;
		var a = this.a;
		var b = this.b;
		var p = this.p;
		var q = this.q;
		var R = this.R;
		//calculate numFloats and then make arrays to hold vertex information
		var numFloats = 3*(N+1)*(M+1);
		this.verts = new Float32Array(numFloats);
		this.normals = new Float32Array(numFloats);
		this.texCoords = new Float32Array(numFloats);
		var n = 0;
		var dt = 2*Math.PI/N, du = 2*Math.PI/M;
		//this is where the magic happens
		for (var i = 0, t = 0.0; i <= N; i++, t += dt) {
			if (i == N) t == 0.0; // wrap around
			//calculate and store derivative information
			var C = [x_t(a, b, q, p, t), y_t(a, b, q, p, t), z_t(b, q, t)];
			var T = [dx_t(a, b, q, p, t), dy_t(a, b, q, p, t), dz_t(b, q, t)];
			var A = [d_dx_t(a, b, q, p, t), d_dy_t(a, b, q, p, t), d_dz_t(b, q, t)];
			//matrix operations
			var B = cross3(T, A);
			T = norm3(T);
			B = norm3(B);
			var N_ = cross3(B,T);
			//more magic happening
			for (var j = 0, u = 0.0; j <= M; j++, u += du) {
				if (j == M) u = 0.0; // wrap around
				var cosu = Math.cos(u), sinu = Math.sin(u);
				for (var k = 0; k < 3; k++) {
					//vertex info goes from matrices to arrays
					this.normals[n] = cosu*N_[k] + sinu*B[k];
					this.verts[n] = C[k] + R*this.normals[n];
					n++;
				}
			}	
		}
    },

    triangleStrip: null,
    
    createTriangleStrip : function() {
	var M = this.M, N = this.N;
	var numIndices = N*(M+2)*2 - 2;
	if (!this.triangleStrip || this.triangleStrip.length != numIndices)
	    this.triangleStrip = new Uint16Array(numIndices);
	var index = function(i, j) {
	    return i*(M+1) + j;
	}
	var n = 0;
	for (var i = 0; i < N; i++) {
	    if (i > 0)  // degenerate connecting index
		this.triangleStrip[n++] = index(i,0);
	    for (var j = 0; j <= M; j++) {
		this.triangleStrip[n++] = index(i,j);
		this.triangleStrip[n++] = index(i+1,j);
	    }
	    if (i < N-1) // degenerate connecting index
		this.triangleStrip[n++] = index(i+1,M)
	}
    },

    wireframe : null, // Uint16Array  (line indices)

    createWireFrame : function() {
	var lines = [];
	lines.push(this.triangleStrip[0], this.triangleStrip[1]);
	var numStripIndices = this.triangleStrip.length;
	for (var i = 2; i < numStripIndices; i++) {
	    var a = this.triangleStrip[i-2];
	    var b = this.triangleStrip[i-1];
	    var c = this.triangleStrip[i];
	    if (a != b && b != c && c != a)
		lines.push(a, c, b, c);
	}
	this.wireframe = new Uint16Array(lines);
    },

    numHedgeHogElements : 0,
    hedgeHog : null,  // Float32Array of lines

    createHedgeHog : function() {
	var lines = [];
	var hedgeHogLength = 0.8*this.r;
	var numNormals = this.normals.length;
	for (var i = 0; i < numNormals; i += 3) {
	    var p = [this.verts[i], this.verts[i+1], this.verts[i+2]];
	    var n = [this.normals[i], this.normals[i+1], this.normals[i+2]];
	    var q = [p[0] + hedgeHogLength*n[0],
		     p[1] + hedgeHogLength*n[1],
		     p[2] + hedgeHogLength*n[2]];
	    lines.push(p[0], p[1], p[2],
		       q[0], q[1], q[2]);
	}
	this.numHedgeHogElements = lines.length/3;
	this.hedgeHog = new Float32Array(lines);
    }
   
};
