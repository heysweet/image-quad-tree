/**
 * On "z" keypress, subdivide the drawing based on where
 * the mouse is.
 */

var img;
var frames;
var SCALAR;
var iSCALAR;
var lastUpdate;
var MIN_SUBDIVIDE_MILLIS = 10;
var toDraw;
let shouldSubdivideOnMouseMove = false;

var frameTree;

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};
const zKeyCode = 90;
const xKeyCode = 88;

function preventDefault(e) {
  e = e || window.event;
  if (e.preventDefault)
      e.preventDefault();
  e.returnValue = false;  
}

let lastMouse;

function doSubdivide() {
  var frames = frameTree.get({
    x : (lastMouse.pageX - mouseSize) * iSCALAR,
    y : (lastMouse.pageY - mouseSize) * iSCALAR,
    w : 2 * mouseSize,
    h : 2 * mouseSize
  });

  var _frames = [];

  for (var i = 0; i < frames.length; i++) {
    var subFrames = subdivide(frames[i]);

    if (subFrames) {
      frameTree.remove(frames[i]);

      toDraw = toDraw.concat(subFrames);

      _frames = _frames.concat(subFrames); 
    }
  }

  for (var j = 0; j < _frames.length; j++) {
    frameTree.put(_frames[j]);
  }
};

function onKeyDown(e) {
    if (keys[e.keyCode]) {
        preventDefault(e);
        return false;
    } if (e.keyCode === zKeyCode) {
      doSubdivide();
    } if (e.keyCode === xKeyCode) {
      shouldSubdivideOnMouseMove = !shouldSubdivideOnMouseMove;
    }
}

function disableScroll() {
  if (window.addEventListener) // older FF
      window.addEventListener('DOMMouseScroll', preventDefault, false);
  window.onwheel = preventDefault; // modern standard
  window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
  window.ontouchmove  = preventDefault; // mobile
  document.onkeydown  = onKeyDown;
}

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
  if (frame.w <= 1 || frame.h <= 1) {
    return null;
  }

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

  noStroke();

  toDraw = [{
    x : 0,
    y : 0,
    w : img.width,
    h : img.height,
    color : c.color,
    avgDist : c.avgDist
  }];

  frameTree = QuadTree(0, 0, width, height);
  frameTree.put(toDraw[0]);

  disableScroll();

  window.onmousemove = function (e) {
    lastMouse = e;
    if (shouldSubdivideOnMouseMove) {
      var now = Date.now();

      if (lastUpdate + MIN_SUBDIVIDE_MILLIS >= now) {
        return;
      }

      lastUpdate = now;
      
      doSubdivide();
    }
  };
}

function getPixels() {
  img.loadPixels();
  return img.pixels;
}

var mouseSize = 2;

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
  if (toDraw.length >= 0) {
    for (var i = 0; i < toDraw.length; i++) {
      drawFrame(toDraw[i]);
    }

    toDraw = [];
  }
}