/*globals paper, console, $ */
/*jslint nomen: true, undef: true, sloppy: true */

var NOC = NOC || {};

// Extended Daniel Shiffman's natureofcode example to paper.js
// https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/tree/master/chp05_libraries/box2d-html5

// create local scope to avoid polluting global namespace
NOC.demo = NOC.demo || [];
NOC.demo[0] = function (canvasName) {

// put paper.js in local environment, and setup canvas and tool (for events)
this.paper = new paper.PaperScope();
this.paper.setup(canvasName);

with (this.paper) {

var tool = new Tool();

  var cosTable = new Array(360);
  var sinTable = new Array(360);
  var PI = Math.PI;

  // pre compute sine and cosine values to the nearest degree
  for (i = 0; i < 360; i++) {
    cosTable[i] = Math.cos((i / 360) * 2 * PI);
    sinTable[i] = Math.sin((i / 360) * 2 * PI);
  }

  var fastSin = function (xDeg) {
    var deg = Math.round(xDeg);
    if (deg >= 0) {
      return sinTable[(deg % 360)];
    }
    return -sinTable[((-deg) % 360)];
  };

  var fastCos = function (xDeg) {
    var deg = Math.round(Math.abs(xDeg));
    return cosTable[deg % 360];
  };

// setup objects used in the sketch:

// setup generic object that contains a set of reusable functions.  other shapes derive from B2Generic
var B2Generic = function() {
  this.body = null;
  this.paperShape = null;
};

// This function removes the particle from the box2d world, and also in paper.js
B2Generic.prototype.killBody = function() {
  world.DestroyBody(this.body);
  this.paperShape.remove();
};

// Is the particle ready for deletion?
B2Generic.prototype.done = function() {
  // Let's find the screen position of the particle
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());

  // Is it off the bottom of the screen?  also kill it if the life is non positive
  if (this.life <= 0 || pos.y > height+this.r*2) {
    this.killBody();
    return true;
  }
  return false;
};

B2Generic.prototype.contains = function(x,y) {
  var worldPoint = B2Helper.scaleToWorld(x, y);
  var f = this.body.GetFixtureList();
  var inside = f.TestPoint(worldPoint);
  return inside;
};

B2Generic.prototype.update = function(event) {
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

B2Generic.prototype.changeColor = function(color_) {
  this.paperShape.children[0].fillColor = color_;
};

B2Generic.prototype.getColor = function(color_) {
  return this.paperShape.children[0].fillColor;
};

// for the box, x and y are in pixel space already.  let the B2Helper function do conversion.
var Box = function(x, y) {
  this.w = getRandom(35, 80);
  this.h = getRandom(35, 80);

  this.r = Math.sqrt(this.w*this.w + this.h*this.h); // resuired for B2Generic

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
  fd.restitution = 0.2;
 
  // Create the body
  this.body = world.CreateBody(bd);
  // Attach the fixture
  this.body.CreateFixture(fd);

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(-10, 10)));
  this.body.SetAngularVelocity(getRandom(-5,5));

  // needed for collision:
  this.body.SetUserData(this);

  // creates the shape to be drawn by paper.js
  this.paperShape = new Group();
  this.paperShape.addChild( Path.Rectangle({
    point:  [0, 0],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor(),
    //opacity:  getRandom(0.3, 0.7)
  }) );
  this.paperShape.position = new Point(x, y);
  this.paperShape.transformContent = false;

};
Box.prototype = new B2Generic();

// for the particle (circle), x and y are in pixel space already.  let the B2Helper function do conversion.
var Particle = function(x, y, r) {
  this.r = getRandom(20, 35);

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
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(-10, 10)));
  this.body.SetAngularVelocity(getRandom(-5,5));

  // needed for collision:
  this.body.SetUserData(this);

  // creates the shape to be drawn by paper.js
  var circle = new Path.Circle({
    center:  [0, 0],
    radius:   this.r,
    fillColor:    getRandomColor(),
    //opacity:  getRandom(0.3, 0.7)
  });
  var line = new Path.Line({
    from:   [0, 0],
    to:     [0+this.r, 0],
  });

  this.paperShape = new Group();
  this.paperShape.addChild(circle);
  this.paperShape.addChild(line);
  this.paperShape.strokeColor = 'black';
  this.paperShape.position = new Point(x, y);
  this.paperShape.transformContent = false;


};
Particle.prototype = new B2Generic();

  var foodCreatureSettings = {
    creatureType: 'food',
    radius: 16,
    maxSpeed: 1,
    maxForce: 0.05,
    nMembranePoints: 8,
    bodyColor: '#5AC74E',
    shakiness:  0.08,
    smoothBody: true
  };
  var hunterCreatureSettings = {
    creatureType: 'hunter',
    radius: 48,
    maxSpeed: 3,
    maxForce: 0.15,
    nMembranePoints: 16,
    bodyColor: '#C83232',
    shakiness:  0.03,
    smoothBody: true
  };

// for the box, x and y are in pixel space already.  let the B2Helper function do conversion.
var Creature = function(x, y) {
  var creatureSettings = hunterCreatureSettings;
  if (getRandom(0, 1) < 0.5) {
    creatureSettings = foodCreatureSettings;
  }
  this.r = creatureSettings.radius*getRandom(0.8, 1.2);
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
  this.body.SetLinearVelocity(new box2d.b2Vec2(getRandom(-10, 10), getRandom(-10, 10)));
  this.body.SetAngularVelocity(getRandom(-5,5));

  // needed for collision:
  this.body.SetUserData(this);

  // creature specific drawing:
  var i = 0; thetaStep = 0;
  this.nMembranePoints = creatureSettings.nMembranePoints;

    this.membraneDeviation = new Array(this.nMembranePoints);
    this.membraneLocX = new Array(this.nMembranePoints);
    this.membraneLocY = new Array(this.nMembranePoints);
    thetaStep = 360 / this.nMembranePoints;
    for (i = 0; i < this.nMembranePoints; i += 1) {
      this.membraneDeviation[i] = 0;
      this.membraneLocX[i] = fastSin(i * thetaStep);
      this.membraneLocY[i] = fastCos(i * thetaStep);
    }

    this.bodyColor = creatureSettings.bodyColor;
    this.smoothBody = creatureSettings.smoothBody;
    this.shakiness = creatureSettings.shakiness;

// create items:
    this.eye = [];
    this.pupil = [];

    for (i = 0; i < 2; i++) {

        this.pupil[i] = new Path.Ellipse({
          center: [0, 0],
          radius: this.r / 6,
          fillColor: 'black'
        }).sendToBack();


      this.eye[i] = new Path.Ellipse({
        center: [0, 0],
        radius: this.r / 3,
        fillColor: 'white',
        strokeColor: 'black'
      }).sendToBack();

    }

    this.head = new Path();

    this.head.strokeColor = 'black';
    i = this.nMembranePoints - 1;
    for (; i >= 0; i--) {
      this.head.add(new Point(this.r * this.membraneLocX[i], this.r * this.membraneLocY[i]));
    }
    this.head.closed = true;
    this.head.fillColor = getRandomColor();
    //this.head.opacity = getRandom(0.4, 0.9);
    
    this.head.sendToBack();

  // creates the shape to be drawn by paper.js

  this.paperShape = new Group();
  this.paperShape.addChild(this.head);
  this.paperShape.addChild(this.eye[0]);
  this.paperShape.addChild(this.eye[1]);
  this.paperShape.addChild(this.pupil[0]);
  this.paperShape.addChild(this.pupil[1]);

  this.paperShape.position = new Point(x, y);
  this.paperShape.transformContent = false;

};
Creature.prototype = new B2Generic();

  Creature.prototype.animateItems = function () {
    var i = this.nMembranePoints - 1,
      deviation = 0.0,
      r = this.r,
      eyeIndex, eyeDist = 0.6,
      len, antilen, locX, locY;
    for (; i >= 0; i--) {
      deviation = this.membraneDeviation[i];
      deviation += r * this.shakiness * getRandom(-1.0, 1.0);
      deviation *= 0.95;
      this.membraneDeviation[i] = deviation;
      len = r + deviation;
      locX = this.membraneLocX[i];
      locY = this.membraneLocY[i];
      this.head.segments[i].point.x = len * locX;
      this.head.segments[i].point.y = len * locY;
    }
    if (this.smoothBody) {
      this.head.smooth();
    }

    for (i = 0; i < 2; i++) {
      eyeIndex = Math.round(this.nMembranePoints * (1 - (0.625 + 0.25 * i)));
      len = r + this.membraneDeviation[eyeIndex] * 1;
      antilen = r + this.membraneDeviation[eyeIndex + 1 - 2 * i] * 1;
      locX = this.membraneLocX[eyeIndex];
      locY = this.membraneLocY[eyeIndex];
      this.eye[i].position = [len * locX * eyeDist * len / r, len * locY * eyeDist * antilen / r];
      this.eye[i].radius = [len / 3, len / 3];
      if (this.pupil[i]) { // if creature has eye pupil
        this.pupil[i].position = [len * locX * eyeDist * len / r, len * locY * eyeDist * antilen / r];
        this.pupil[i].radius = [len / 6, len / 6];
      }
    }
  };

Creature.prototype.update = function(event) {
  // Get the body's position
  var pos = B2Helper.scaleToPixels(this.body.GetPosition());
  // Get its angle of rotation
  var a = this.body.GetAngleDegrees();
  
  this.animateItems();
  // Draw it!
  // translate:
  this.paperShape.position.x = pos.x;
  this.paperShape.position.y = pos.y;
  // rotation:
  this.paperShape.rotate(a-this.paperShape.rotation);

};

// Class to describe the spring joint (displayed as a line)

// Constructor
var Spring = function(x,y) {
  // At first it doesn't exist
  this.mouseJoint = null;
  this.paperLine = null;
};

// If it exists we set its target to the mouse location 
Spring.prototype.update = function(x, y) {
  if (this.mouseJoint !== null) {
    // Always convert to world coordinates!
    var mouseWorld = B2Helper.scaleToWorld(x,y);
    this.mouseJoint.SetTarget(mouseWorld);

    var posA = this.mouseJoint.GetAnchorA();
    var posB = this.mouseJoint.GetAnchorB();

    // We can get the two anchor points
    var v1 = B2Helper.scaleToPixels(posA.x, posA.y);
    var v2 = B2Helper.scaleToPixels(posB.x, posB.y);

    if (this.paperLine) {
      // set location for line that represents spring
      this.paperLine.segments[0].point.x = v1.x;
      this.paperLine.segments[0].point.y = v1.y;
      this.paperLine.segments[1].point.x = v2.x;
      this.paperLine.segments[1].point.y = v2.y;
    } else {
      // create the line that represents spring and initialize with end locations to objs
      this.paperLine = new Path.Line({
        from:   [v1.x, v2.y],
        to:     [v2.x, v2.y],
        strokeColor:  getRandomColor(),
        strokeWidth:  4,
        //opacity:  getRandom(0.2, 0.7)
      });
    }

  }
};


// This is the key function where
// we attach the spring to an x,y location
// and the Box object's location
Spring.prototype.bind = function(x,y,box) {
  // Define the joint
  var md = new box2d.b2MouseJointDef();
  // Body A is just a fake ground body for simplicity (there isn't anything at the mouse)
  md.bodyA = world.CreateBody(new box2d.b2BodyDef()); //world.GetGroundBody();
  // Body 2 is the box's boxy
  md.bodyB = box.body;
  // Get the mouse location in world coordinates
  var mp = B2Helper.scaleToWorld(x,y);
  // And that's the target
  //println(mp.x + " " + mp.y);
  md.target = mp;
  //println(md.target.x + " " + md.target.y);

  // Some stuff about how strong and bouncy the spring should be
  md.maxForce = 1000.0 * box.body.m_mass;
  md.frequencyHz = 5.0;
  md.dampingRatio = 0.9;

  // Make the joint!
  this.mouseJoint = world.CreateJoint(md);
};

Spring.prototype.destroy = function() {
  // We can get rid of the joint when the mouse is released
  if (this.mouseJoint !== null) {
    world.DestroyJoint(this.mouseJoint);
    this.mouseJoint = null;
    if ( this.paperLine ) {
      this.paperLine.remove();
    }
    this.paperLine = null;
  }
};

// ContactListener to listen for collisions!

var CustomListener = function() {

};

// Collision event functions!
CustomListener.prototype.BeginContact = function(contact) {
  // Get both fixtures
  var f1 = contact.GetFixtureA();
  var f2 = contact.GetFixtureB();
  // Get both bodies
  var b1 = f1.GetBody();
  var b2 = f2.GetBody();

  // Get our objects that reference these bodies
  var o1 = b1.GetUserData();
  var o2 = b2.GetUserData();

  if (o1 instanceof B2Generic && o2 instanceof B2Generic) {
    /*
    var color1 = o1.getColor();
    var color2 = o2.getColor();
    o1.changeColor(color2);
    o2.changeColor(color1);
    */
  }

};

// Objects stop touching each other
CustomListener.prototype.EndContact = function(contact) {
};

CustomListener.prototype.PreSolve = function(contact,manifold) {
};

CustomListener.prototype.PostSolve = function(contact,manifold) {
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

/*
  // creates the shape to be drawn by paper.js
  this.shape = new Shape.Rectangle({
    point:  [this.x-this.w/2, this.y-this.h/2],
    size:   [this.w, this.h],
    strokeColor:  'black',
    fillColor:    getRandomColor()
  });
*/
};

// event handler function for mouse (if applicable)

// When the mouse is released we're done with the spring
var mouseReleased = function() {
  spring.destroy();
};

var mousePressed = function (event) {
  // create a new random item at the mouse click location

  // Boxes fall from the top every so often
  var i, mouseX, mouseY;

  for (i = 0; i < boxes.length; i++) {
    mouseX = event.point.x;
    mouseY = event.point.y;
    // Check to see if the mouse was clicked on the box
    if (boxes[i].contains(mouseX, mouseY)) {
      // And if so, bind the mouse location to the box with a spring
      spring.bind(mouseX,mouseY,boxes[i]);
      break;
    }
  }

};

var mouseMoved = function(event) {
  mousePos.x = event.point.x;
  mousePos.y = event.point.y;
};

// main animation loop:

var draw = function (event) {

  // main simulation step for physics engine. 
  // 2nd and 3rd arguments are velocity and position iterations
  world.Step(timeStep,10,10);

  // Always alert the spring to the new mouse location
  spring.update(mousePos.x,mousePos.y);

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
  var c = new Color(getRandom(0.5, 1.0), getRandom(0.5, 1.0), getRandom(0.5, 1.0));
  return c;
};

// init and setup:

// timestep (1 frame = 1 / 60 fps)
var timeStep = 1.0/60;
var MAX_LIFE = 200; // life of object in frames
var SHADER_FREQ = 5;

var i, value, RandomItem;

// A reference to our box2d world
var world;

// A list we'll use to track fixed objects
var boundaries = [];

// A list for all of our boxes
var boxes = [];

// The Spring that will attach to the box from the mouse
var spring;

// screen size
var height = view.size.height;
var width = view.size.width;

// mouse position
var mousePos = new Point(width/2, height/2);

// Initialize box2d physics and create the world
world = B2Helper.createWorld(10, true);// switch off gravity

world.SetContactListener(new CustomListener()); // changes color during collisions

spring = new Spring(); // mouse controlled spring

// Add a bunch of fixed boundaries
boundaries.push(new Boundary(width/2,height-5,width,10,0));
boundaries.push(new Boundary(width/2,5,width,10,0));
boundaries.push(new Boundary(width-5,height/2,10,height,0));
boundaries.push(new Boundary(5,height/2,10,height,0));

for (i = 0; i < 20; i++ ) {
  value = getRandom(0, 3);

  if ( value < 1 ) {
    RandomItem = Box;
  } else if (value < 2) {
    RandomItem = Particle;
  } else {
    RandomItem = Creature;
  }

  boxes.push( new RandomItem(getRandom(1/8, 7/8)*width,getRandom(1/8, 7/8)*height) );

}

// write the fps into the canvas
var fps_data = new PointText(24, 36);
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
desc.content = 'Creatures.';
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
  tool.onMouseUp = mouseReleased;
  tool.onMouseMove = mouseMoved;
  //tool.onMouseDrag = mousePressed;
}

};

