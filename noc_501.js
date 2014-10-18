// Extended Daniel Shiffman's natureofcode example to paper.js

// objects:

// A rectangular box
// paper-js usage:

// create local scope to avoid polluting global namespace
(function () {

// put paper.js in local environment, and setup canvas and tool (for events)
paper.install(window);
paper.setup('myCanvas');
var tool = new Tool();

// setup objects used in the sketch:

// for the box, x and y are in pixel space already.  let the B2Helper function do conversion.
var Box = function(x, y) {
  this.w = getRandom(10, 30);
  this.h = getRandom(10, 30);

   // Define a body
  var bd = new box2d.b2BodyDef();
  bd.type = box2d.b2BodyType.b2_dynamicBody;
  bd.position = B2Helper.scaleToWorld(x,y);

  // Define a fixture
  var fd = new box2d.b2FixtureDef();
  // Fixture holds shape
  fd.shape = new box2d.b2PolygonShape();
  fd.shape.SetAsBox(B2Helper.scaleToWorld(this.w/2), B2Helper.scaleToWorld(this.h/2));
  
  // Some physics
  fd.density = 1.0;
  fd.friction = 0.5;
  fd.restitution = 0.2;
 
  // Create the body
  this.body = world.CreateBody(bd);
  // Attach the fixture
  this.body.CreateFixture(fd);

  // creates the shape to be drawn by paper.js
  this.shape = new Shape.Rectangle({
    point:  [x-this.w/2, y-this.h/2],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor()
  });

};


// update the box's locations.  paper.js will handle the drawing after it is updated
// unlike p5/processing where draw function must draw the box again every time.
Box.prototype.update = function() {
  // Get the body's position
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());
  // Get its angle of rotation
  var a = this.body.GetAngleDegrees();
  
  // Draw it!
  // translate:
  this.shape.position.x = pos.x;
  this.shape.position.y = pos.y;
  // rotation:
  this.shape.rotate(a-this.shape.rotation);

};

// This function removes the particle from the box2d world, and also in paper.js
Box.prototype.killBody = function() {
  world.DestroyBody(this.body);
  this.shape.remove();
};

// Is the particle ready for deletion?
Box.prototype.done = function() {
  // Let's find the screen position of the particle
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());

  // Is it off the bottom of the screen?
  if (pos.y > height+this.w*this.h) {
    this.killBody();
    return true;
  }
  return false;
};

var mousePressed = function (event) {
  if (clickMe) {
    clickMe.remove();
    clickMe = null;
  }
  // create a new box at the mouse click location
  var b = new Box(event.point.x,event.point.y);
  boxes.push(b);
};

// main animation loop:

draw = function (event) {

  // main simulation step for physics engine. 
  // 2nd and 3rd arguments are velocity and position iterations
  world.Step(timeStep,10,10);

  // update location/orientation for all the boxes (rather than redrawing them)
  for (var i = boxes.length-1; i >= 0; i--) {
    boxes[i].update();
    if (boxes[i].done()) {
      boxes.splice(i,1);
    }
  }
};

// useful helper functions
getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
};

getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

getRandomColor = function() {
  var c = new Color(Math.random(), Math.random(), Math.random());
  return c;
};

// init and setup:

// timestep (1 frame = 1 / 60 fps)
var timeStep = 1.0/60;

// screen size
var height = view.size.height;
var width = view.size.width;

// A reference to our box2d world
var world;

// A list for all of our boxes
var boxes = [];

// Initialize box2d physics and create the world
world = B2Helper.createWorld();

// set animation and event hooks:

var desc = new PointText(24, height-24);
desc.content = 'Box2D with Paper.js.';
desc.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#aaaaaa',
  justification: 'left'
};

var clickMe = new PointText(width*1/2, height*1/4);
clickMe.content = 'Click on me.';
clickMe.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#eb6276',
  justification: 'center'
};

window.onload = function () {
  view.onFrame = draw;
  tool.onMouseDown = mousePressed;
  tool.onMouseDrag = mousePressed;
};

})();

