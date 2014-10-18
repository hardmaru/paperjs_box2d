/*globals paper, console, $ */
/*jslint nomen: true, undef: true, sloppy: true */

var NOC = NOC || {};

// Extended Daniel Shiffman's natureofcode example to paper.js
// https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/tree/master/chp05_libraries/box2d-html5

// create local scope to avoid polluting global namespace
NOC.demo = NOC.demo || [];
NOC.demo[7] = function (canvasName) {

// put paper.js in local environment, and setup canvas and tool (for events)
this.paper = new paper.PaperScope();
this.paper.setup(canvasName);

with (this.paper) {

var tool = new Tool();

// setup objects used in the sketch:

// for the box, x and y are in pixel space already.  let the B2Helper function do conversion.
var Box = function(x, y, w, h, lock) {
  this.w = w;
  this.h = h;

  //
  this.life = MAX_LIFE; // dies after MAX_LIFE frames, with some randomness.

   // Define a body
  var bd = new box2d.b2BodyDef();
  if ( lock ){
    bd.type = box2d.b2BodyType.b2_staticBody;
  } else {
    bd.type = box2d.b2BodyType.b2_dynamicBody;
  }
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

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(2, 5)));
  this.body.SetAngularVelocity(getRandom(-5,5));

  // creates the shape to be drawn by paper.js
  this.paperShape = new Group();
  this.paperShape.addChild( Path.Rectangle({
    point:  [0, 0],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor()
  }) );
  this.paperShape.position = new Point(x, y);
  this.paperShape.transformContent = false;

};

// This function removes the particle from the box2d world, and also in paper.js
Box.prototype.killBody = function() {
  world.DestroyBody(this.body);
  this.paperShape.remove();
};

// Is the particle ready for deletion?
Box.prototype.done = function() {
  // Let's find the screen position of the particle
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());

  // Is it off the bottom of the screen?  also kill it if the life is non positive
  if (this.life <= 0 || pos.y > height+this.w*this.h) {
    this.killBody();
    return true;
  }
  return false;
};

// update the box's locations.  paper.js will handle the drawing after it is updated
// unlike p5/processing where draw function must draw the box again every time.
Box.prototype.update = function(event) {
  // Get the body's position
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());
  // Get its angle of rotation
  var a = this.body.GetAngleDegrees();
  
  // Draw it!
  // translate:
  this.paperShape.position.x = pos.x;
  this.paperShape.position.y = pos.y;
  // rotation:
  this.paperShape.rotate(a-this.paperShape.rotation);

};

// for the particle (circle), x and y are in pixel space already.  let the B2Helper function do conversion.
var Particle = function(x, y, r) {
  this.item_id = getItemID();
  //console.log("a Particle is created with ID = "+this.item_id);
  this.r = getRandom(10, 15);

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
  //console.log("a Particle is destroyed with ID = "+this.item_id);
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

};

// creating a windmill to demonstrate motor function:

// Constructor
var Windmill = function(x,y) {
  this.len = 32;

  this.box1 = new Box(x, y-20, width/4, 10, false); 
  this.box2 = new Box(x, y, 20, 40, true); 

  // Define joint as between two bodies
  var rjd = new box2d.b2RevoluteJointDef();

  rjd.Initialize(this.box1.body, this.box2.body, this.box1.body.GetWorldCenter());

  // Turning on a motor (optional)
  rjd.motorSpeed = Math.PI*2;       // how fast?
  rjd.maxMotorTorque = 16000.0; // how powerful?
  rjd.enableMotor = false;      // is it on?

  // There are many other properties you can set for a Revolute joint
  // For example, you can limit its angle between a minimum and a maximum
  // See box2d manual for more

  // Create the joint
  this.joint = world.CreateJoint(rjd);

  // Draw anchor just for debug
  var anchor = B2Helper.scaleToPixels(this.box1.body.GetWorldCenter());
  this.shape = new Path.Circle({
    center:       [anchor.x, anchor.y],
    radius:       8,
    strokeColor:  'black',
    fillColor:    'red'
  });

};


Windmill.prototype.update = function(event) {
  this.box2.update(event);
  this.box1.update(event);
};

// Turn the motor on or off
Windmill.prototype.toggleMotor = function() {
  this.joint.EnableMotor(!this.motorOn());
};

Windmill.prototype.motorOn = function() {
  return this.joint.IsMotorEnabled();
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
  // create a new random item at the mouse click location

  windmill.toggleMotor();
  if (windmill.motorOn()) {
    windmill_text.content = 'motor is on.  click to disable motor';
    windmill.shape.fillColor = 'green';
    windmill_text.style.fillColor = 'red';
  } else {
    windmill_text.content = 'motor is off. click to enable motor';
    windmill.shape.fillColor = 'red';
    windmill_text.style.fillColor = 'green';
  }

};

// main animation loop:

var draw = function (event) {

  // main simulation step for physics engine. 
  // 2nd and 3rd arguments are velocity and position iterations
  world.Step(timeStep,10,10);

  if (getRandom(0, 1) < 0.1) {
    var item = new Particle(getRandom(width*0.4, width*0.6), height*getRandom(-0.1, 0.1));
    boxes.push(item);
  }

  windmill.update(event);

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

// A list for all of our boxes
var boxes = [];
var boundaries = [];

// screen size
var height = view.size.height;
var width = view.size.width;

// Initialize box2d physics and create the world
world = B2Helper.createWorld();

// creating the windmill:
windmill = new Windmill(width/2,height*1/3);

// Add a bunch of fixed boundaries
boundaries.push(new Boundary(3*width/8,height*7/8,width/3,10));
boundaries.push(new Boundary(5*width/8,3*height/4,width/3,20));
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

var windmill_text = new PointText(width-24, height-24);
windmill_text.content = 'motor is off. click to enable motor';
windmill_text.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 16,
  fillColor: 'green',
  justification: 'right'
};

var desc = new PointText(24, height-24);
desc.content = 'Rotating motor demo.';
desc.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#aaaaaa',
  justification: 'left'
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
//  tool.onMouseDrag = mousePressed; // dragging doesn't toggle anything in this example.
}

};

