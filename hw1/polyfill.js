/*
David Parrott
CS 442 Fall 2014
HW1 
*/
exports.polyfill = polyfill

//holds the relevant information about an edge
function Edge(ystart, yend, dxdy, x, z, dzdy, a, q, dady, dqdy){
   this.ystart = ystart;
   this.yend = yend;
   this.dxdy = dxdy;
   this.x = x;
   this.z = z;
   this.dzdy = dzdy;
   this.a = a;
   this.q = q;
   this.dady = dady;
   this.dqdy = dqdy;
}

//builds the edge table from two vectors passed into it. Alters the passed table
//rather than returning it
function EdgeTable(v1, v2, table){
	//get variables from vectors
	var x0 = v1.x;
	var x1 = v2.x;
	var y0 = v1.y;
	var y1 = v2.y;
	var z0 = v1.z;
	var z1 = v2.z;
	var q0 = v1.q;
	var q1 = v2.q;
	var a0 = v1.a;
	var a1 = v2.a;

	//compute dy to determine if line is horizontal and return it if so
	var dy = y1 - y0;
	if(dy === 0){return;}

	var dxdy = (x1 - x0)/dy;				//edge slope
	var dzdy = (z1 - z0)/dy;				//depth slope
	var dqdy = (q1 - q0)/dy;				//q slope
	var dady = new Array(5);
	for(var i = 0; i < a0.length; i++){
		dady[i] = (a1[i] - a0[i])/dy;
	}

	if(y0 < y1){  							//y0 = top edge y-value
		var ystart = Math.ceil(y0);			//starting scan line
		var yend = Math.ceil(y1);			//last scan line +1
		if(ystart === yend){return;}		//between scan lines
		var ey = ystart - y0;				//distance to first scan line
		var ex = ey * dxdy;					//x adjustment
		var x = x0 + ex;					//initial x value
		var ez = ey * dzdy;					//depth adjustment
		var z = z0 + ez;					//initial z value
		var eq = ey * dqdy;
		var q = q0 + eq;
		var ea = new Array(5);
		for(var i = 0; i < a0.length; i++){
			ea[i] = ey * dady[i];
		}
		var a = new Array(5);
		for(var i = 0; i < a.length; i++){
			a[i] = a0[i] + ea[i];
		}
		var edge = new Edge(ystart, yend, dxdy, x, z, dzdy, a, q, dady, dqdy);	//create new edge
		table.push(edge);					//store new edge
		return;								
	} else {								//y1 = top edge y-value
		var ystart = Math.ceil(y1);			//starting scan line
		var yend = Math.ceil(y0);			//last scan line +1
		if(ystart === yend){return;}		//between scan lines
	    var ey = ystart - y1;				//distance to first scan line
	    var ex = ey*dxdy;					//x adjustment
	    var x = x1 + ex;					//initial x value
	    var ez = ey*dzdy;					//depth adjustment
	    var z = z1 + ez;					//initial z value
	    var eq = ey * dqdy;					
		var q = q1 + eq;					//initial q value
		var ea = new Array(5);
		for(var i = 0; i < a0.length; i++){
			ea[i] = ey * dady[i];
		}
		var a = new Array(5);				//initial a value
		for(var i = 0; i < a.length; i++){
			a[i] = a1[i] + ea[i];
		}
	    var edge = new Edge(ystart,yend,dxdy,x,z,dzdy,a,q, dady, dqdy);			//create new edge
	    table.push(edge);					//store new edge
	    return;
	}
}

//fill span with interpolate depth
function FillSpan(leftEdge, rightEdge, fragmentFunc, y){
	var xstart = Math.ceil(leftEdge.x);		//find left most x
	var xend = Math.ceil(rightEdge.x);		//find right most x
	if(xend > xstart){						//make sure we're in the right place
		var dx = rightEdge.x - leftEdge.x;	//change in x
		var dzdx = (rightEdge.z - leftEdge.z)/dx;				//change in z div by change in x
		var dqdx = (rightEdge.q - leftEdge.q)/dx;				//change in q divided by change in x
		var dadx = new Array(5);								//change in a divided by change in x
		for(var i = 0; i < dadx.length; i++){
			dadx[i] = (rightEdge.a[i] - leftEdge.a[i])/dx;
		}
		var ex = xstart - leftEdge.x;		//calculate offset
		var z = leftEdge.z + ex * dzdx;		//shifted z
		var q = leftEdge.q + ex * dqdx;		//shifted q
		var a = new Array(5);				//shifted a
		for(var i = 0; i < a.length; i++){
			a[i] = leftEdge.a[i] + ex * dadx[i];
		}
		for(var x = xstart; x < xend; ++x){	//fill in pixels using passed function
			fragmentFunc(x, y, z);
			z += dzdx;						//increment z
			q += dqdx;						//increment q
			for(var i = 0; i < a.length; i++){					//increment a
				a[i] += dadx[i]/dqdx;
			}
		}
	}
}

function lerp(a, b, t){

}

function polyfill(polygons, fragmentFunc){
	var edgeTable = [];						//holds the edge table
	var activeEdgeTable = [];				//holds the active edge table

	//create the edge table
	for(var i = 0; i < polygons.length; i++){
		var poly = polygons[i];				//put a polygon into poly
		for(var j = 1; j < poly.length; j++){
			var v1 = poly[j-1];				//get a vertex pair and pass it to EdgeTable()
			var v2 = poly[j];
			EdgeTable(v1, v2, edgeTable);
		}
											//don't forget the last vertex hooked to the first
		EdgeTable(poly[poly.length-1], poly[0], edgeTable);
	}										//sort the edge table
	edgeTable.sort(function(a,b) {return a.ystart - b.ystart;});

	y = edgeTable[0].ystart;				//y = smallest edge.ystart

	//repeat until edge table and active edge table are empty
	while(edgeTable.length !== 0 || activeEdgeTable.length !== 0){
		for(var i = 0; i < edgeTable.length; i++){					//for each edge in edgeTable
			if(edgeTable[i].ystart <= y){							//if y = ystart move from edgeTable to activeEdgeTable
				activeEdgeTable.push(edgeTable[i]);					//add to AET
				edgeTable.splice(i,1);								//remove from ET
				i--;
			}
		}
		activeEdgeTable.sort(function(a,b){return a.x - b.x;});		//sort AET on edge.x

	   if ((activeEdgeTable.length / 2) !== 0){
	      //console.log("assertion failed\n");
	   }

		for (var i = 0; i < activeEdgeTable.length-1; i+=2){		//fill spans
			FillSpan(activeEdgeTable[i], activeEdgeTable[i+1], fragmentFunc, y);
		}
		
		y += 1;														//increment scan line

		for(var i = 0; i < activeEdgeTable.length; i ++){			//remove from AET edge where y = yend
			if( activeEdgeTable[i].yend <= y){
				activeEdgeTable.splice(i,1);
				i--;
			}
		}

		for(var i = 0; i < activeEdgeTable.length; i++){			//update edge values for next scan line
			activeEdgeTable[i].x += activeEdgeTable[i].dxdy;
			activeEdgeTable[i].z += activeEdgeTable[i].dzdy;
			activeEdgeTable[i].q += activeEdgeTable[i].dqdy;
			for(var j = 0; j < 5; j++){
				activeEdgeTable[i].a[j] += activeEdgeTable[i].dady[j];
			}
		}
	}
}