var fs = require('fs');
var polyfill = require('./polyfill.js').polyfill;

if (process.argv.length != 4) {
    process.stderr.write("usage: node polyfilltest.js " + 
			 "<white|yellow|depth|color|checker|mandrill> <poly.json>\n");
    process.exit(1);
}

var fillStyle = process.argv[2];

var polySource;
try {
    polySource = fs.readFileSync(process.argv[3]);
} catch (e) {
    process.stderr.write("Unable to read input file '" + process.argv[3] + "'\n");
    process.stderr.write(e + "\n");
    process.exit(2);
}

var polygons;
try {
    polygons = JSON.parse(polySource);
} catch (e) {
    process.stderr.write("Unable to parse JSON file '" + process.argv[2] + "'\n");
    process.stderr.write(e + "\n");
    process.exit(3);
}

var xmax = 100, ymax = 100;  // minimum image size
for (var n = 0; n < polygons.length; n++) {
    var poly = polygons[n];
    for (var i = 0; i < poly.length; i++) {
	var x = poly[i].x;
	var y = poly[i].y;
	if (x > xmax) xmax = x;
	if (y > ymax) ymax = y;
    }
}

var imageWidth = Math.ceil(1.1*xmax);
var imageHeight = Math.ceil(1.1*ymax);

var sz = imageWidth*imageHeight*3;
var image = new Array(sz);
for (var i = 0; i < sz; i++)   // clear image
    image[i] = 0;

//
// Fill white polygon (ignore all attributes)
//
function whiteFill(x, y, z, a) {
    if (0 <= x && x < imageWidth && 0 <= y && y < imageHeight) {
	var i = y*(imageWidth*3) + x*3;
	for (var k = 0; k < 3; k++)
	    image[i+k] = 255;
     }
}

function yellowFill(x, y, z, a) {
    if (0 <= x && x < imageWidth && 0 <= y && y < imageHeight) {
	var i = y*(imageWidth*3) + x*3;
        image[i] = 255;
        image[i+1] = 255;
        image[i+2] = 0;
    }
}

//
// Fill with depth value 
//
function depthFill(x, y, z, a) {
    if (0 <= x && x < imageWidth && 0 <= y && y < imageHeight) {
	var i = y*(imageWidth*3) + x*3;
	for (var k = 0; k < 3; k++)
	    image[i+k] = z;
     }
}

//
// Fill with color value: 
//   RGB color stored in a[0..2].
//
function colorFill(x, y, z, a) {
    if (0 <= x && x < imageWidth && 0 <= y && y < imageHeight) {
	var i = y*(imageWidth*3) + x*3;
	for (var k = 0; k < 3; k++)
	    image[i+k] = Math.round(255.0*a[k]);
     }
}

//
// Fill with checker pattern using texture
// coordinates stored in a[3,4].
//
function checkerFill(x, y, z, a) {
    if (0 <= x && x < imageWidth && 0 <= y && y < imageHeight) {
	var numCheckers = 7;
	var s = Math.floor(a[3]*numCheckers);
	var t = Math.floor(a[4]*numCheckers);
	var i = y*(imageWidth*3) + x*3;
	if ((s + t) % 2 == 0) {
	    image[i] = 210;
	    image[i+1] = 210;
	    image[i+2] = 210;
	} else {
	    image[i] = 0;
	    image[i+1] = 0;
	    image[i+2] = 128;
	}
    }
}


var mandrillImage;

function getMandrillImage() {
    var mandrillFile = "mandrill.json";
    var mandrillSource;
    try {
	mandrillSource = fs.readFileSync(mandrillFile);
    } catch (e) {
	process.stderr.write("Unable to read input file '" + mandrillFile + "'\n");
	process.stderr.write(e + "\n");
	process.exit(2);
    }
    try {
	mandrillImage = JSON.parse(mandrillSource);
    } catch (e) {
	process.stderr.write("Unable to parse JSON file '" + mandrillFile + "'\n");
	process.stderr.write(e + "\n");
	process.exit(3);
    }
    mandrillImage.read = function(u, v) {
	var x = Math.round(u*(this.width-1)); // XXXX
	var y = Math.round(v*(this.height-1));
	if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	    return [0, 0, 0];
	}
	var index = 3*(y*this.width + x);
	return this.pixels.slice(index, index+3);
    }
}


function mandrillFill(x, y, z, a) {
    if (!mandrillImage) {
	getMandrillImage();
    }
    if (0 <= x && x < imageWidth && 0 <= y && y < imageHeight) {
	var s = a[3];
	var t = a[4];
	var color = mandrillImage.read(s, t);
	var i = y*(imageWidth*3) + x*3;
	image[i] = color[0];
	image[i+1] = color[1];;
	image[i+2] = color[2];
    }
}

switch(fillStyle) {
case "white":
    polyfill(polygons, whiteFill);
    break;
case "yellow":
    polyfill(polygons, yellowFill);
    break;
case "depth":
    polyfill(polygons, depthFill);
    break;
case "color":
    polyfill(polygons, colorFill);
    break;
case "checker":
    polyfill(polygons, checkerFill);
    break;
case "mandrill":
    polyfill(polygons, mandrillFill);
    break;
default:
    process.stderr.write("Unknown fill style '" + fillStyle + "'\n");
    process.exit(2);
}


process.stdout.write("P3\n");
process.stdout.write(imageWidth + " " + imageHeight + "\n");
process.stdout.write("255\n");
var i = 0;
for (var r = 0; r < imageHeight; r++) {
    for (var c = 0; c < imageWidth; c++) {
	for (var k = 0; k < 3; k++) {
	    process.stdout.write(image[i++] + " ");
	}
    }
    process.stdout.write("\n");
}