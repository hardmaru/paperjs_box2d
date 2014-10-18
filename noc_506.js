/*globals paper, console, $ */
/*jslint nomen: true, undef: true, sloppy: true */

var NOC = NOC || {};

// Extended Daniel Shiffman's natureofcode example to paper.js
// https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/tree/master/chp05_libraries/box2d-html5

// create local scope to avoid polluting global namespace
NOC.demo = NOC.demo || [];
NOC.demo[6] = function (canvasName) {

// put paper.js in local environment, and setup canvas and tool (for events)
this.paper = new paper.PaperScope();
this.paper.setup(canvasName);

with (this.paper) {

var tool = new Tool();

// setup objects used in the sketch:

// for the particle (circle), x and y are in pixel space already.  let the B2Helper function do conversion.
var Particle = function(x, y, r) {
  this.item_id = getItemID();
  console.log("a Particle is created with ID = "+this.item_id);
  this.r = getRandom(10, 20);

  //
  this.life = MAX_LIFE; // dies after MAX_LIFE frames, with some randomness.

   // Define a body
  var bd = new box2d.b2BodyDef();
  bd.type = box2d.b2BodyType.b2_dynamicBody;
  bd.position = B2Helper.scaleToWorld(x,y);

  // Define a fixture
  var fd = new box2d.b2FixtureDef();
  // Fixture holds shape
  fd.shape = new box2d.b2CircleShape();
  fd.shape.m_radius = B2Helper.scaleToWorld(this.r);
  
  // Some physics
  fd.density = 1.0;
  fd.friction = getRandom(0.1, 0.5);
  fd.restitution = getRandom(0.4, 0.8);
 
  // Create the body
  this.body = world.CreateBody(bd);
  // Attach the fixture
  this.body.CreateFixture(fd);

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(2, 10)));
  //this.body.SetAngularVelocity(getRandom(-5,5));

  // creates the shape to be drawn by paper.js
  var circle = new Path.Circle({
    center:  [0, 0],
    radius:   this.r,
    fillColor:    getRandomColor()
  });
  var line = new Path.Line({
    from:   [0, 0],
    to:     [0+this.r, 0],
  });

  this.shape = new Group();
  this.shape.addChild(circle);
  this.shape.addChild(line);
  this.shape.strokeColor = 'black';
  this.shape.position = new Point(x, y);
  this.shape.transformContent = false;

};

// This function removes the particle from the box2d world, and also in paper.js
Particle.prototype.killBody = function() {
  console.log("a Particle is destroyed with ID = "+this.item_id);
  world.DestroyBody(this.body);
  this.shape.remove();
};

// Is the particle ready for deletion?
Particle.prototype.done = function() {
  // Let's find the screen position of the particle
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());
  var opacity;

  // Is it off the bottom of the screen?  also kill it if the life is non positive
  if (this.life <= 0 || pos.y > height+this.r*2) {
    this.killBody();
    return true;
  }
  return false;
};

// update the box's locations.  paper.js will handle the drawing after it is updated
// unlike p5/processing where draw function must draw the box again every time.
Particle.prototype.update = function(event) {
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

  // fade out when life decreases
  // (for this example, we don't make the objects die, so commented out below)
  /*
  if (event.count % SHADER_FREQ === 0) { // do every half a second
    opacity = Math.max(0,this.life) / MAX_LIFE;
    this.shape.opacity = opacity;
  }
  */

  // subtract orandom life every frame
  // (for this example, we don't make the objects die, so commented out below)
  // this.life -= getRandom(0, 1);

};

// Two particles connected with distance joints

// Constructor
var Pair = function(x,y) {
  this.item_id = getItemID();
  console.log("a Pair is created with ID = "+this.item_id);
  this.len = getRandom(40, 60);

  this.p1 = new Particle(x,y);
  this.p2 = new Particle(x+getRandom(-1,1),y+getRandom(-1,1));

  var djd = new box2d.b2DistanceJointDef();
  // Connection between previous particle and this one
  djd.bodyA = this.p1.body;
  djd.bodyB = this.p2.body;
  // Equilibrium length
  djd.length = B2Helper.scaleToWorld(this.len);
  
  // These properties affect how springy the joint is 
  djd.frequencyHz = getRandom(2, 5);  // Try a value less than 5 (0 for no elasticity)
  djd.dampingRatio = getRandom(0.1, 0.5); // Ranges between 0 and 1 (1 for no springiness)

  // Make the joint.  make a reference (to destroy later after it does)
  this.dj = world.CreateJoint(djd);

  // draw a line between the 2 particles in paper.js
  // creates the shape to be drawn by paper.js

  this.paperLine = new Path.Line({
    from:   this.p1.shape.position,
    to:     this.p2.shape.position,
    strokeColor:  getRandomColor(),
    strokeWidth:  this.len / getRandom(10, 20),
    opacity:  getRandom(0.2, 0.7)
  });


};

Pair.prototype.done = function() {
  var isDone = false;
  if ( this.p1.done() ) {
    isDone = true;
    this.p2.killBody();
  } else if ( this.p2.done() ) {
    isDone = true;
    this.p1.killBody();
  }
  if ( isDone ) {
    world.DestroyJoint(this.dj);
    this.paperLine.remove();
    console.log("a Pair is destroyed with ID = "+this.item_id);
    return true;
  }
    return false;
};

Pair.prototype.update = function(event) {
  // Get the body's position
  this.p1.update(event);
  this.p2.update(event);
  this.paperLine.segments[0].point = this.p1.shape.position;
  this.paperLine.segments[1].point = this.p2.shape.position;
};

// A fixed boundary class

  // A boundary is a simple rectangle with x,y,width,and height
var Boundary = function(x_,y_, w_, h_) {
  // But we also have to make a body for box2d to know about it
  // Body b;

  this.x = x_;
  this.y = y_;
  this.w = w_;
  this.h = h_;

  var fd = new box2d.b2FixtureDef();
  fd.density = 1.0;
  fd.friction = 0.5;
  fd.restitution = 0.2;
 
  var bd = new box2d.b2BodyDef();
 
  bd.type = box2d.b2BodyType.b2_staticBody;

  bd.position = B2Helper.scaleToWorld(this.x,this.y);
  //bd.position.x = B2Helper.scaleToWorld(this.x);
  //bd.position.y = B2Helper.scaleToWorld(this.y);
  fd.shape = new box2d.b2PolygonShape();
  fd.shape.SetAsBox(B2Helper.scaleToWorld(this.w/2), B2Helper.scaleToWorld(this.h/2));
  this.body = world.CreateBody(bd).CreateFixture(fd);

  // creates the shape to be drawn by paper.js
  this.shape = new Shape.Rectangle({
    point:  [this.x-this.w/2, this.y-this.h/2],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor()
  });
};

// event handler function for mouse (if applicable)

var mousePressed = function (event) {

  if (clickMe) {
    clickMe.remove();
    clickMe = null;
  }

  // create a new random item at the mouse click location

  var item;

  item = new Pair(event.point.x,event.point.y);

  boxes.push(item);

};

// main animation loop:

var draw = function (event) {

  // main simulation step for physics engine. 
  // 2nd and 3rd arguments are velocity and position iterations
  world.Step(timeStep,10,10);

  // update location/orientation for all the boxes (rather than redrawing them)
  for (var i = boxes.length-1; i >= 0; i--) {
    boxes[i].update(event);
    if (boxes[i].done()) {
      boxes.splice(i,1);
    }
  }
};

// useful helper functions
var getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
};

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

var getRandomColor = function() {
  var c = new Color(Math.random(), Math.random(), Math.random());
  return c;
};

// generate a unique item id for debugging:
var getItemID = function() {
  item_id += 1;
  return item_id;
};

// init and setup:

// timestep (1 frame = 1 / 60 fps)
var timeStep = 1.0/60;
var MAX_LIFE = 200; // life of object in frames
var SHADER_FREQ = 5;

var item_id = 0;

// A reference to our box2d world
var world;

// A list we'll use to track fixed objects
var boundaries = [];

// A list for all of our boxes
var boxes = [];

// screen size
var height = view.size.height;
var width = view.size.width;

// Initialize box2d physics and create the world
world = B2Helper.createWorld();

// Add a bunch of fixed boundaries
boundaries.push(new Boundary(3*width/8,height*7/8,width/3,10));
boundaries.push(new Boundary(5*width/8,height/2,width/3,20));
boundaries.push(new Boundary(width-5,height/2,10,height,0));
boundaries.push(new Boundary(5,height/2,10,height,0));

// write the fps into the canvas
var fps_data = new PointText(16, 24);
fps_data.content = 60;
fps_data.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 16,
  fillColor: '#cacaca',
  justification: 'left'
};
fps_data.prevTimeStamp = 0.0;

var desc = new PointText(24, height-24);
desc.content = 'Spring linked objects.';
desc.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#aaaaaa',
  justification: 'left'
};

var clickMe = new PointText(width/2, height*1/3);
clickMe.content = 'Click on me.';
clickMe.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#eb6276',
  justification: 'center'
};

// set animation and event hooks:


  view.onFrame = function(event) {
    var fps = Math.round(600 / (event.time-fps_data.prevTimeStamp)) / 10;
    // update fps every 60 frames.
    if ((event.count + 1) % 60 === 0) {
      fps_data.content = fps;
      fps_data.prevTimeStamp = event.time;
    }
    draw(event);
  };
  tool.onMouseDown = mousePressed;
  tool.onMouseDrag = mousePressed;
}

};

