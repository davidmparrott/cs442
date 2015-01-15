exports.polyfill = polyfill; // at top of polyfill.js

//Edge objects which will hold information needed to do
//the span
function Edge(ys,ye,dxdy, x,z, dzdy){
   this.ystart = ys;
   this.yend = ye;
   this.dxdy = dxdy;
   this.x = x;
   this.z = z;
   this.dzdy = dzdy;
   //this.q = 0;
   //this.a = null
}

//Subroutine to compute edge data given two vertices
//doesn't return anything; it either adds the calculated
//edge data to the table or doesn't it it's a horizontal
//edge, etc.
function computeEdata(v1,v2, table){
   var x0 = v1.x; var x1 = v2.x;
   var y0 = v1.y; var y1 = v2.y;
   var z0 = v1.z; var z1 = v2.z;	
   //var q0 = v1.q; var q1 = v2.q;
   //var a0 = v1.a; var a1 = v2.a; 
   //interpolation of q and a needs to be here

   var dy = y1 - y0; //edge height
   if (dy === 0){return;} //horitzontal edge
   var dxdy = (x1 - x0)/dy; //edge slope 
   var dzdy = (z1 - z0)/dy; //depth slope
   if (y0 <= y1){ //y0 = top edge y-value
      ystart = Math.ceil(y0); //starting scan line
      yend = Math.ceil(y1);  //last scan line + 1
      if (ystart === yend){return;} //discard, between scan lines
      var ey = ystart - y0; //dist. to 1scan scan line
      var ex = ey*dxdy; //x adjustment
      var x = x0 + ex; //initial x value
      var ez = ey*dzdy; //depth adjustment
      var z = z0 + ez; //initial z-value      
      var edge = new Edge(ystart,yend,dxdy,x,z,dzdy);
      table.push(edge);
      return;      

   } else {  // y1 = top edge y-value
      //***not sure if right***
      ystart = Math.ceil(y1);
      yend = Math.ceil(y0);
      if (ystart === yend){return;}
      var ey = ystart - y1;
      var ex = ey*dxdy;
      var x = x1 + ex;
      var ez = ey*dzdy;
      var z = z1 + ez;
      var edge = new Edge(ystart,yend,dxdy,x,z,dzdy);
      table.push(edge);
      return;
   }
}

function fillspan(lefte, righte, func, yi){
   var xstart = Math.ceil(lefte.x);
   var xend = Math.ceil(righte.x);
   if (xend > xstart){
      var dx = righte.x - lefte.x;
      var dzdx = (righte.z - lefte.z)/dx;
      var ex = xstart - lefte.x;
      var z = lefte.z + ex*dzdx;
      for (var x = xstart; x < xend; ++x){
         func(x, yi, z, null); //this needs to be changed for later
         z += dzdx;            
      }
   }   
}

function polyfill(polygons, Fragfunc){

var edgeTable = []
var activeEtable = []

for (var i = 0; i < polygons.length; i++){
   var poly = polygons[i]; //process all the individual primitives
   for (var j = 1; j < poly.length; j++){ //proccess vertex/vertex
      var vertex1 = poly[j-1]; var vertex2 = poly[j];
      computeEdata(vertex1, vertex2, edgeTable);	
   }    
   computeEdata(poly[poly.length-1], poly[0], edgeTable) //connect last vertex
}
//EDGE TABLE IS NOW CONSTRUCTED

//Sort the edge table on the y component of each edge
edgeTable.sort(function(a,b){return a.ystart - b.ystart;})

var y = edgeTable[0].ystart //trying to grab min .ystart here

//MAIN FUNCTION LOGIC
while ((edgeTable.length !== 0) && (activeEtable.length !== 0)){

   for (var i = 0; i < edgeTable.length; ++i){
      if (edgeTable[i].ystart === y){
         activeEtable[activeEtable.length] = edgeTable.splice(i,1);}
   }
   activeEtable.sort(function(a,b){return a.x - b.x;})

   //assert that aEt has 2n edges
   if ((activeEtable.length / 2) !== 0){
      console.log("assertion failed\n");
   }

   //fill span part
   for (var k = 0; k < activeEtable.length-2; k+=2){
      fillSpan(activeEtable[k], activeEtable[k+1], Fragfunc, y);
   }

   y += 1;

   //removed app. edges
   for (var l = 0; l < activeEtable.length; l++){
      if (y === activeEtable[l].yend){
         var temp = edgeTable.splice(l,1);
         temp = null;
      }	
   }

   for (var n = 0; n < activeEtable.length; n++){
      activeEtable[n].x += activeEtable[n].dxdy;
      activeEtable[n].z += activeEtable[n].dzdy;  
   }

}//end while loop

/**/}

