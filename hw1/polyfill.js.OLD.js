exports.polyfill = polyfill

//from http://stackoverflow.com/questions/15313418/javascript-assert
//just a nice way to improve readability with a DIY assert
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

function Edge(ys, ye, dxdy, x, z, dzdy){
   this.ystart = ys;
   this.yend = ye;
   this.dxdy = dxdy;
   this.x = x;
   this.z = z;
   this.dzdy = dzdy;
}

function EdgeTable(v1, v2, table){
	//get variables from vectors
	var x0 = v1.x;
	var x1 = v2.x;
	var y0 = v1.y;
	var y1 = v2.y;
	var z0 = v1.z;
	var z1 = v2.z;

	//compute dy to determine if line is horizontal and return it if so
	var dy = y1 - y0;
	if(dy === 0){return;}

	var dxdy = (x1 - x0)/dy;				//edge slope
	var dzdy = (z1 - z0)/dy;				//depth slope

	if(y0 <= y1){  							//y0 = top edge y-value
		var ystart = Math.ceil(y0);			//starting scan line
		var yend = Math.ceil(y1);			//last scan line +1
		if(ystart === yend){return;}		//between scan lines
		var ey = y0 - ystart;				//distance to first scan line
		var ex = ey * dxdy;					//x adjustment
		var x = x0 + ex;					//initial x value
		var ez = ey * dzdy;					//depth adjustment
		var z = z0 + ez						//initial z value
		var edge = new Edge(ystart, yend, dxdy, x, z, dzdy);	//create new edge
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
	    var edge = new Edge(ystart,yend,dxdy,x,z,dzdy);			//create new edge
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
		var ex = xstart - leftEdge.x;		//calculate offset
		var z = leftEdge.z + ex * dzdx;		//shifted z
		for(var x = xstart; x < xend; ++x){	//fill in pixels using passed function
			fragmentFunc(x, y, z);
			z += dzdx;						//increment z
		}
	}
}

function PolyFill(polygons, fragmentFunc){
	var edgeTable = [];						//holds the edge table
	var activeEdgeTable = [];				//holds the active edge table

	//create the edge table
	for(var i = 0; i < polygons.length; i++){
		var poly = polygons[i];				//put a polygon into poly
		for(var j = 1; j < poly.length; j++){
			var v1 = poly[j-1];				//get a vertex pair and pass it to EdgeTable()
			var v2 = poly[2];
			EdgeTable(v1, v2, edgeTable);
		}
											//don't forget the last vertex hooked to the first
		EdgeTable(poly[poly.length-1], poly[0], edgeTable);
	}										//sort the edge table
	edgeTable.sort(function(a,b) {return a.ystart - b.ystart;});

	y = edgeTable[0].ystart;				//y = smallest edge.ystart

	//repeat until edge table and active edge table are empty
	while(edgeTable.length !== 0 && activeEdgeTable.length !== 0){
		for(var i = 0; i < edgeTable.length; i++){					//for each edge in edgeTable
			if(edgeTable[i].ystart === y){							//if y = ystart move from edgeTable to activeEdgeTable
				activeEdgeTable.push(edgeTable[i]);					//add to AET
				edgeTable.splice(i,1);								//remove from ET
				i--;
			}
		}
		activeEdgeTable.sort(function(a,b){return a.x - b.x;});		//sort AET on edge.x
		var cond = ((activeEtable.length / 2) !== 0);				//assertion condition
		assert(cond, "even number of edges in AET");				//call assert

		for (var i = 0; i < activeEdgeTable.length-2; i+=2){		//fill spans
			FillSpan(activeEdgeTable[i], activeEdgeTable[i+1], fragmentFunc, y);
		}
		
		y += 1;														//increment scan line

		for(var i = 0; i < activeEdgeTable.length; i ++){			//remove from AET edge where y = yend
			if( activeEdgeTable[i].yend === y){
				activeEdgeTable.splice(i,1);
			}
		}

		for(var i = 0; i < activeEdgeTable.length; i++){			//update edge values for next scan line
			activeEdgeTable[i].x += activeEdgeTable[i].dxdy;
			activeEdgeTable[i].z += activeEdgeTable[i].dzdy;
		}
	}
}