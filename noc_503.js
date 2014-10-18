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
  this.w = getRandom(20, 40);
  this.h = getRandom(30, 60);

  //
  this.life = MAX_LIFE; // dies after MAX_LIFE frames, with some randomness.

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
  fd.restitution = 0.6;
 
  // Create the body
  this.body = world.CreateBody(bd);
  // Attach the fixture
  this.body.CreateFixture(fd);

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(2, 10)));
  this.body.SetAngularVelocity(getRandom(-5,5));

  // creates the shape to be drawn by paper.js
  this.shape = new Group();
  this.shape.addChild( Path.Rectangle({
    point:  [0, 0],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor()
  }) );
  this.shape.position = new Point(x, y);
  this.shape.transformContent = false;

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
  this.shape.position.x = pos.x;
  this.shape.position.y = pos.y;
  // rotation:
  this.shape.rotate(a-this.shape.rotation);

  // fade out when life decreases
  if (event.count % SHADER_FREQ === 0) { // do every half a second
    this.shape.opacity = Math.max(0,this.life) / MAX_LIFE;
  }

  // subtract orandom life every frame
  this.life -= getRandom(0, 1);

};

// for the particle (circle), x and y are in pixel space already.  let the B2Helper function do conversion.
var Particle = function(x, y, r) {
  this.r = getRandom(15, 40);

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
  fd.friction = 0.1;
  fd.restitution = 0.8;
 
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
  if (event.count % SHADER_FREQ === 0) { // do every half a second
    opacity = Math.max(0,this.life) / MAX_LIFE;
    this.shape.opacity = opacity;
  }

  // subtract orandom life every frame
  this.life -= getRandom(0, 1);

};

// A fixed boundary class

// An uneven surface boundary
Surface = function (width_, height_) {
  var width = width_;
  var height = height_;
  var i, v;

  this.surface = [];
  // Here we keep track of the screen coordinates of the chain
  this.surface.push(new box2d.b2Vec2(0, 3*height/4));
  this.surface.push(new box2d.b2Vec2(width/2, 3*height/4+height/8));
  this.surface.push(new box2d.b2Vec2(width, 3*height/4));

  for (i = 0; i < this.surface.length; i++) {
    this.surface[i] = B2Helper.scaleToWorld(this.surface[i]);
  }

  // This is what box2d uses to put the surface in its world
  var chain = new box2d.b2ChainShape();
  chain.CreateChain(this.surface, this.surface.length);
  
  // Need a body to attach shape!
  var bd = new box2d.b2BodyDef();
  this.body = world.CreateBody(bd);

  // Define a fixture
  var fd = new box2d.b2FixtureDef();
  // Fixture holds shape
  fd.shape = chain;

  // Some physics
  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.3;

  // Attach the fixture
  this.body.CreateFixture(fd);

  // draw the surface:
  this.shape = new Path();
  this.shape.strokeColor = 'black';

  for (i = 0; i < this.surface.length; i++) {
    v = B2Helper.scaleToPixels(this.surface[i]);
    this.shape.add(new Point(v.x, v.y));
  }
  this.shape.add(new Point(width, height));
  this.shape.add(new Point(0, height));
  this.shape.closed = true;
  this.shape.fillColor = getRandomColor();

};

// event handler function for mouse (if applicable)

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

  // Boxes fall from the top every so often
  var chance = getRandom(0,1);
  if (chance < 0.05) {
    var item;
    if (chance < 0.025) {
      item = new Box(width/2,30);
    } else {
      item = new Particle(width/2,30);
    }
    boxes.push(item);
  }

  // update location/orientation for all the boxes (rather than redrawing them)
  for (var i = boxes.length-1; i >= 0; i--) {
    boxes[i].update(event);
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
var MAX_LIFE = 200; // life of object in frames
var SHADER_FREQ = 20;

// A reference to our box2d world
var world;

// A list we'll use to track fixed objects
var surface;

// A list for all of our boxes
var boxes = [];

// screen size
var height = view.size.height;
var width = view.size.width;

// Initialize box2d physics and create the world
world = B2Helper.createWorld();

// Add a bunch of fixed boundaries
surface = new Surface(width, height);

var b = new Box(width/2,30);
boxes.push(b);

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

var desc = new PointText(width, 24);
desc.content = 'Boundaries and Shapes.';
desc.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#aaaaaa',
  justification: 'right'
};

var clickMe = new PointText(width*1/4, height*1/4);
clickMe.content = 'Click on me.';
clickMe.style = {
  fontFamily: 'Courier New',
  fontWeight: 'normal',
  fontSize: 24,
  fillColor: '#eb6276',
  justification: 'center'
};

// set animation and event hooks:

window.onload = function () {
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
};

})();

