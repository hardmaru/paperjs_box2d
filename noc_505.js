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

// multishape example
var Lollipop = function(x, y) {
  this.w = getRandom(4, 16);
  this.h = this.w*getRandom(2, 4);
  this.r = this.w*getRandom(0.8, 1.2);
  this.life = MAX_LIFE;

  // Define a body
  var bd = new box2d.b2BodyDef();
  bd.type = box2d.b2BodyType.b2_dynamicBody;
  bd.position = B2Helper.scaleToWorld(x,y);

  // Define fixture #1
  var fd1 = new box2d.b2FixtureDef();
  // Fixture holds shape
  fd1.shape = new box2d.b2PolygonShape();
  fd1.shape.SetAsBox(B2Helper.scaleToWorld(this.w/2), B2Helper.scaleToWorld(this.h/2));
  fd1.density = 1.0;
  fd1.friction = 0.5;
  fd1.restitution = 0.2;
 
  // Define fixture #2
  var fd2 = new box2d.b2FixtureDef();
  fd2.shape = new box2d.b2CircleShape();
  fd2.shape.m_radius = B2Helper.scaleToWorld(this.r);
  var offset = B2Helper.scaleToWorld(new box2d.b2Vec2(0,-this.h/2));
  fd2.shape.m_p = new box2d.b2Vec2(offset.x,offset.y);
  fd2.density = 1.0;
  fd2.friction = 0.5;
  fd2.restitution = 0.2;

  // Create the body
  this.body = world.CreateBody(bd);
  // Attach the fixture
  this.body.CreateFixture(fd1);
  this.body.CreateFixture(fd2);

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(2, 10)));
  this.body.SetAngularVelocity(getRandom(-5,5));

  // creates the shape to be drawn by paper.js
  this.paperShape = new Group();
  this.paperShape.addChild( Path.Rectangle({
    point:  [-this.w/2, -this.h/2],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor()
  }) );
  this.paperShape.addChild( Path.Circle({
    center:  [0, -this.h/2],
    radius:   this.r,
    strokeColor:  'black',
    fillColor:    getRandomColor()
  }) );
  // have to add hidden circle larger than object to ensure that (0,0) is consistent with b2d's (0x0)
  this.paperShape.addChild( Path.Circle({ 
    center:  [0, 0],
    radius:   this.r+this.h/2,
    hidden:   true
  }) );
  this.paperShape.position = new Point(x, y);
  this.paperShape.transformContent = false;

};

// This function removes the particle from the box2d world, and also in paper.js
Lollipop.prototype.killBody = function() {
  world.DestroyBody(this.body);
  this.paperShape.remove();
};

// Is the particle ready for deletion?
Lollipop.prototype.done = function() {
  // Let's find the screen position of the particle
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());

  // Is it off the bottom of the screen?  also kill it if the life is non positive
  if (this.life <= 0 || pos.y > height+this.w*this.h) {
    this.killBody();
    return true;
  }
  return false;
};

// update the item's locations.  paper.js will handle the drawing after it is updated
// unlike p5/processing where draw function must draw the box again every time.
Lollipop.prototype.update = function(event) {
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

  // fade out when life decreases
  if (event.count % SHADER_FREQ === 0) { // do every half a second
    this.paperShape.opacity = Math.max(0,this.life) / MAX_LIFE;
  }

  // subtract orandom life every frame
  this.life -= getRandom(0, 1);

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

  // Boxes fall from the top every so often
  var chance = getRandom(0,1);

  var item;

  item = new Lollipop(event.point.x,event.point.y);

  boxes.push(item);

};

// main animation loop:

draw = function (event) {

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
var SHADER_FREQ = 5;

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

var b = new Lollipop(width/2,30);
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

var desc = new PointText(24, height-24);
desc.content = 'Multishape objects.';
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

