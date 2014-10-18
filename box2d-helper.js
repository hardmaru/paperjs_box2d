

var B2Helper = B2Helper || (function () {

// -----------------------------------------------------------------------------
// Scale Methods
// -----------------------------------------------------------------------------

var scaleFactor = 10;

var helper = {

getScaleFactor: function() {
  return scaleFactor;
},

scaleToWorld: function(a,b) {
  var newv;
  if (a instanceof box2d.b2Vec2) {
    newv = new box2d.b2Vec2();
    newv.x = (a.x)/scaleFactor;
    newv.y = (a.y)/scaleFactor;
    return newv;
  } else if ("undefined"!=typeof b) {
    newv = new box2d.b2Vec2();
    newv.x = (a)/scaleFactor;
    newv.y = (b)/scaleFactor;
    return newv;
  } else {
    return a/scaleFactor;
  }
},

scaleToPixels: function(a,b) {
  var newv;
  if (a instanceof box2d.b2Vec2) {
    newv = new box2d.b2Vec2();
    newv.x = a.x*scaleFactor;
    newv.y = a.y*scaleFactor;
    return newv;
  } else if ("undefined"!=typeof b) {
    newv = new box2d.b2Vec2();
    newv.x = a*scaleFactor;
    newv.y = b*scaleFactor;
    return newv;
  } else {
    return a*scaleFactor;
  }
},

// -----------------------------------------------------------------------------
// Create Methods
// -----------------------------------------------------------------------------

createWorld: function(scaleFactor_, noGravityFlag_) {

  var theGravity = 20;

  if ( noGravityFlag_ ) {
    theGravity = 0;
  }

	var worldAABB = new box2d.b2AABB();
	worldAABB.lowerBound.SetXY(-this.bounds, -this.bounds);
	worldAABB.upperBound.SetXY(this.bounds, this.bounds);
	var gravity = new box2d.b2Vec2(0,theGravity);
	var doSleep = true;

  scaleFactor = scaleFactor_ || scaleFactor;

	return new box2d.b2World(gravity, doSleep);
}

};

return helper;

})();

