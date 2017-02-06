var img;
var frames;
var SCALAR;
var iSCALAR;
var shouldDraw;

var frameTree;

function preload() {
  img = loadImage("images/image1.jpg");
}

function getAverageColor(img, x, y, dx, dy) {
  // Pixels is array of uints r, g, b, a, repeat
  var numPixels = 0;
  var width = img.width;

  var distance = 0;
  var color = {
    r : 0,
    g : 0,
    b : 0,
    a : 0
  };

  x = Math.floor(x);
  x *= 4;
  y = Math.floor(y);

  for (var i = x; i < x + (dx * 4); i += 4) {
    for (var j = y; j < (y + dy); j++) {

      var index = (j * (img.width * 4)) + i;

      color.r += img.pixels[index];
      color.g += img.pixels[index + 1];
      color.b += img.pixels[index + 2];
      color.a += img.pixels[index + 3];
      numPixels += 1;
    }
  }

  numPixels = numPixels ? numPixels : 1;

  color.r = Math.round(color.r / numPixels);
  color.g = Math.round(color.g / numPixels);
  color.b = Math.round(color.b / numPixels);
  color.a = Math.round(color.a / numPixels);

  for (var i = x * 4; i < ((x + dx) * 4); i += 4) {
    for (var j = y; j < (y + dy); j++) {

      var index = (j * img.width) + i;

      var r = color.r - img.pixels[index];
      var g = color.g - img.pixels[index + 1];
      var b = color.b - img.pixels[index + 2];
      var a = color.a - img.pixels[index + 3];

      var cDist = Math.sqrt((r*r) + (g*g) + (b*b) + (a*a));

      distance += cDist;
    }
  }

  return {
    color : color,
    avgDist : distance
  };
}

function subdivide(frame) {
  var halfWidth = frame.w / 2;
  var halfHeight = frame.h / 2;

  var frames = [{
      x : frame.x,
      y : frame.y,
      w : halfWidth,
      h : halfHeight
    },
    {
      x : frame.x + halfWidth,
      y : frame.y,
      w : halfWidth,
      h : halfHeight
    },
    {
      x : frame.x + halfWidth,
      y : frame.y + halfHeight,
      w : halfWidth,
      h : halfHeight
    },
    {
      x : frame.x,
      y : frame.y + halfHeight,
      w : halfWidth,
      h : halfHeight
    }
  ];

  for (var i = 0; i < frames.length; i++) {
    var c = getAverageColor(
      img,
      frames[i].x,
      frames[i].y,
      frames[i].w,
      frames[i].h
    );

    frames[i].color = c.color;
    frames[i].avgDist = c.avgDist;
  }

  return frames;
}

function setup() {
  var width = img.width;
  var height = img.height;

  SCALAR = Math.min(window.innerWidth / width, window.innerHeight / height);
  iSCALAR = 1 / SCALAR;

  width *= SCALAR;
  height *= SCALAR;

  createCanvas(width, height);
  image(img, 0, 0, width, height);
  getPixels();

  var c = getAverageColor(img, 0, 0, img.width, img.height);

  shouldDraw = true;
  noStroke();

  frameTree = QuadTree(0, 0, width, height);
  frameTree.put({
    x : 0,
    y : 0,
    w : img.width,
    h : img.height,
    color : c.color,
    avgDist : c.avgDist
  });

  window.onmousemove = function (e) {
    var frames = frameTree.get({
      x : (e.pageX - mouseSize) * iSCALAR,
      y : (e.pageY - mouseSize) * iSCALAR,
      w : 2 * mouseSize,
      h : 2 * mouseSize
    });

    var _frames = [];

    for (var i = 0; i < frames.length; i++) {
      frameTree.remove(frames[i]);

      _frames = _frames.concat(subdivide(frames[i]));
    }

    for (var j = 0; j < _frames.length; j++) {
      frameTree.put(_frames[j]);
    }

    shouldDraw = true;
  };
}

function getPixels() {
  img.loadPixels();
  return img.pixels;
}

var mouseSize = 10;

function drawFrame(frame) {
  fill(frame.color.r, frame.color.g, frame.color.b, frame.color.a);
  noStroke();

  rect(
    frame.x * SCALAR,
    frame.y * SCALAR,
    frame.w * SCALAR,
    frame.h * SCALAR
  );
}

function draw() {
  if (shouldDraw){
    background(255,255,255);
    shouldDraw = false;

    var results = frameTree.get({
      x : 0,
      y : 0,
      w : img.width,
      h : img.height,
    });

    for (var i = 0; i < results.length; i++) {
      drawFrame(results[i]);
    }
  }
}