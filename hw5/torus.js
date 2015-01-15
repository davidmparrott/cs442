/*
David Parrott (in collaboration with Brett Carter and Zacharias Shufflebarger)
11239947
CS 442 Fall 2014
Reflections and Shadows
*/

var plane = {
	verts : null,
	texCoords : null,
	normals : null,
	triangleStrip : null,

	createGeometry : function() {
	    this.verts = new Float32Array([
	        -2, -2,  0,
	        -2,  2,  0,
	         2,  2,  0,
	         2, -2,  0 
	    ]);
		this.texCoords = new Float32Array([
			-2, -2,
			-2,  2,
			 2,  2,
			 2, -2,
			]);
		this.normals = new Float32Array([
			 0,  0,  1,
			 0,  0,  1,
			 0,  0,  1,
			 0,  0,  1,			 
			]);	
	},
  
    createTriangleStrip : function() {
	this.triangleStrip = new Uint16Array([
	    	 2, 1, 3, 0   
	    	]);
    },  
};

var torus = { 
    N : null,
    M : null,

    verts : null,
    normals : null,
    texCoords : null,
    longitude : null,
    latitude : null,

    createGeometry : function() {
		var N = this.N, M = this.M;
		var numFloats = 3 * (N + 1) * (M + 1);
		//declare vertex, normal, texture coordinate, lattitude and longitude buffers
		if (!this.verts || this.verts.length != numFloats) {
		    this.verts = new Float32Array(numFloats);
		    this.normals = new Float32Array(numFloats);
		    this.texCoords = new Float32Array(2 * (N + 1) * (M + 1));
    		this.longitude = new Float32Array(N + 1);
			this.latitude = new Float32Array(M + 1)
		}
		//bulge factors 
		var n = 2; 
		var m = 2;
/*
This loop not only populates the vertex and normal buffers, it also performs the
summation that will be used to calculate S(i,j) and T(i,j) later.

To avoid z-fighting a low epsilon is chosen and tested against
*/
		for (var i = 0; i < N + 1; i++) {
		    for (var j = 0; j < M + 1; j++) {
				var u = (2 * Math.PI/M) * j - Math.PI;
				var v = (Math.PI/N) * i - Math.PI/2;
				var sinuab = Math.abs(Math.sin(u));
				var cosuab = Math.abs(Math.cos(u));
				var sinvab = Math.abs(Math.sin(v)); 
				var cosvab = Math.abs(Math.cos(v));
				
				if(cosvab < 0.0000001 || cosuab < 0.0000001){//z-fighting
				    this.verts[3 * (i * (M + 1) + j)] = 0.0;
				    this.normals[3 * (i * (M + 1) + j)] = 0.0;
				}
				else{
				    this.verts[3 * (i * (M + 1) + j)] = Math.cos(v) * Math.pow(cosvab,(2.0/m) - 1) * Math.cos(u) * Math.pow(cosuab,(2.0/n) - 1);
				    this.normals[3 * (i * (M + 1) + j)] = Math.cos(v) * Math.pow(cosvab,(1 - 2.0/m)) * Math.cos(u) * Math.pow(cosuab,(1 - 2.0/n));
				}
				if(cosvab < 0.0000001 || sinuab < 0.0000001){//z-fighting
				    this.verts[3 * (i * (M + 1) + j) + 1] = 0.0;
				    this.normals[3 * (i * (M + 1) + j) + 1] = 0.0;
				}
				else{
				    this.verts[3 * (i * (M + 1) + j) + 1] = Math.cos(v) * Math.pow(cosvab,(2.0/m) - 1) * Math.sin(u) * Math.pow(sinuab,(2.0/n) - 1);
				    this.normals[3 * (i * (M + 1) + j) + 1] = Math.cos(v) * Math.pow(cosvab,(1 - 2.0/m)) * Math.sin(u) * Math.pow(sinuab,(1 - 2.0/n));
				}
				if(sinvab < 0.0000001){//z-fighting
				    this.verts[3 * (i * (M + 1) + j) + 2] = 1.0;
				    this.normals[3 * (i * (M + 1) + j) + 2] = 0.0;
				}
				else{
				    this.verts[3 * (i * (M + 1) + j) + 2] = Math.sin(v) * Math.pow(sinvab,(2.0/m) - 1) + 1.0;
				    this.normals[3 * (i * (M + 1) + j) + 2] = Math.sin(v) * Math.pow(sinvab, (1 - 2.0/m));
				}
/*
This is where the initial summation for use later is calculated and stored
to avoid unnecessary looping
*/
				var x1, x2, y1, y2, z1, z2, distance;
				//calculate lattitude distances
				if(i > 0){
				    x1 = this.verts[3 * ((i - 1) * (M + 1) + j)];
				    y1 = this.verts[3 * ((i - 1) * (M + 1) + j) + 1];
				    z1 = this.verts[3 * ((i - 1) * (M + 1) + j) + 2];
				    x2 = this.verts[3 * (i * (M + 1) + j)];
				    y2 = this.verts[3 * (i * (M + 1) + j) + 1];
				    z2 = this.verts[3 * (i * (M + 1) + j) + 2];
				    distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
				    this.latitude[j] += distance;
				}
				//calculate the longitude distances
				if(j > 0){
				    x1 = this.verts[3 * (i * (M + 1) + j - 1)];
				    y1 = this.verts[3 * (i * (M + 1) + j - 1) + 1];
				    z1 = this.verts[3 * (i * (M + 1) + j - 1) + 2];
				    x2 = this.verts[3 * (i * (M + 1) + j)];
				    y2 = this.verts[3 * (i * (M + 1) + j) + 1];
				    z2 = this.verts[3 * (i * (M + 1) + j) + 2];
				    distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
				    this.longitude[i] += distance;
				}
		    }
		}

/*
Finalize the adjustments to the lattitude and longitude coordinates
so that they are evenly spaced over the surface
*/
		for(var i = 0; i < N + 1; i++){
		    var distance = 0;
		    for(var j = 0; j < M + 1; j++){
				if(j == 0){				//S(i,0) = 0
				    this.texCoords[2 * (i * (M + 1) + j)] = 0;
				}
				else if(i == N){		//S(N,j) = S(N-1,j)
				    this.texCoords[2 * (i * (M + 1) + j)] = this.texCoords[2 * (i * (M + 1))];
				}
				else{			
				    var x1, x2, y1, y2, z1, z2;
				    x1 = this.verts[3 * (i * (M + 1) + j - 1)];
				    y1 = this.verts[3 * (i * (M + 1) + j - 1) + 1];
				    z1 = this.verts[3 * (i * (M + 1) + j - 1) + 2];
				    x2 = this.verts[3 * (i * (M + 1) + j)];
				    y2 = this.verts[3 * (i * (M + 1) + j) + 1];
				    z2 = this.verts[3 * (i * (M + 1) + j) + 2];

				   	//accumulate the distance
				    distance += Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
				    this.texCoords[2 * (i * (M + 1) + j)] = distance/this.longitude[i];
				}
		    }
		}

		for(var j = 0; j < M + 1; j++){
		    var distance = 0;
		    for(var i = 0; i < N + 1; i++){
				if(i == 0){				//T(j,0) = T(j,1)
				    this.texCoords[2*(i*(M+1)+j)+1] = this.texCoords[2*((M+1)+j)+1];
				}
				else if(j == M){		//wrap around
				    this.texCoords[2*(i*(M+1)+j)+1] = this.texCoords[2*(i*(M+1))+1];
				}
				else{
				    var x1, y1, z1, x2, y2, z2;
				    x1 = this.verts[3 * ((i - 1) * (M + 1) + j)];
				    y1 = this.verts[3 * ((i - 1) * (M + 1) + j) + 1];
				    z1 = this.verts[3 * ((i - 1) * (M + 1) + j) + 2];
				    x2 = this.verts[3 * (i * (M + 1) + j)];
				    y2 = this.verts[3 * (i * (M + 1) + j) + 1];
				    z2 = this.verts[3 * (i * (M + 1) + j) + 2];

				    //accumulate the distance
				    distance += Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
				    this.texCoords[2 * (i * (M + 1) + j) + 1] = distance/this.latitude[j];
				}
		    }
		}

		//handle polar condition
		for(var i = 0; i < M + 1; i++){
		    this.texCoords[2 * i] = this.texCoords[2 * ((M + 1) + i)];
		    this.texCoords[2 * (N * (M + 1) + i)] = this.texCoords[2 * ((N - 1) * (M + 1) + i)];
		}
    },

    triangleStrip: null,
    
    createTriangleStrip : function() {
		var M = this.M, N = this.N;
		//This is the only line I changed in here
		var numIndices = N * (2 * (M + 1) + 2) - 2;
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
				this.triangleStrip[n++] = index(i + 1,j);
				this.triangleStrip[n++] = index(i,j);
			}
		    if (i < N - 1)// degenerate connecting index
				this.triangleStrip[n++] = index(i,M);
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
