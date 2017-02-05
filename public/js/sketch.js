var img;
function preload() {
  img = loadImage("images/image1.jpg");
}

function getAverageColor(img, x, y, dx, dy) {
  // Pixels is array of uints r, g, b, a, repeat
  var numPixels = 0;
  var width = img.width;

  var color = {
    r : 0,
    g : 0,
    b : 0,
    a : 0
  };

  for (var i = x; i < ((x + dx) * 4); i += 4) {
    for (var j = y; j < (y + dy); j++) {

      var index = (j * img.width) + i;

      color.r += img.pixels[index];
      color.g += img.pixels[index + 1];
      color.b += img.pixels[index + 2];
      color.a += img.pixels[index + 3];
      numPixels += 1;
    }
  }

  color.r = Math.round(color.r / numPixels);
  color.g = Math.round(color.g / numPixels);
  color.b = Math.round(color.b / numPixels);
  color.a = Math.round(color.a / numPixels);

  return color;
}

function setup() {
  var width = 2100;
  var height = 800;

  var scalar = 0.6;
  width *= scalar;
  height *= scalar;

  createCanvas(width, height);
  image(img, 0, 0, width, height);
  getPixels();
  getAverageColor(img, 0, 0, img.width, img.height);
}

function getPixels() {
  img.loadPixels();
  return img.pixels;
}

function draw() {

}