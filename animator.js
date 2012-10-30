// Generated by CoffeeScript 1.3.3
/*
  new Animator([raf])

  Set up an animator object. If raf is true or undefined, the animator will be driven
  by requestAnimationFrame, falling back to setTimeout. Setting raf to false will let
  you drive the animator by manually calling animator.tick()

  Usage:
    // Set up the animator object
    var animator = new Animator();
    
    // optional: Set the clear function
    animator.clear = function() {
      clearMyCanvas();
    }

    // Register an actor
    animator.register("myActor", {
      x: 100,
      y: 50,
      draw: function(properties) {
        drawMyActor(properties.x, properties.y);
      }
    });

    // Move the actor left 100 pixels over 1 second ...
    animator.animate("myActor", 1000, {x: 200});

    // ... then wait half a second ...
    animator.delay(500);

    // ... then call some other function ...
    animator.callback(function() {
      console.log('Hello!');
    });

    // ... then move the actor down 50 pixels and left 50 pixels
    animator.animate("myActor", 500, {x: 250, y: 100});

    // Animator functions can be chained, like this:
    animator.register("myActor", {
      x: 100,
      y: 50,
      draw: function(properties) {
        drawMyActor(properties.x, properties.y);
      }
    }).animate("myActor", 1000, {x: 200})
      .delay(500)
      .callback(function() {
        console.log('Hello!');
      });

    and so on.
*/

var Animator;

Animator = (function() {

  function Animator(raf) {
    var req, _ths;
    if (raf == null) {
      raf = true;
    }
    _ths = this;
    this.actors = {};
    this.queue = {};
    this.running = false;
    if (raf) {
      window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      req = function() {
        _ths.tick.apply(_ths);
        return requestAnimationFrame(req);
      };
      requestAnimationFrame(req);
    }
  }

  /*
    Animator.register(name, actor)
  
    Registers a new actor to be animated. Actors are objects containing the properties
    to be animated, as well as a 'draw' function, which is called with the actor object
    as the argument whenever the actor needs to be drawn.
  */


  Animator.prototype.register = function(name, actor) {
    if (actor.draw) {
      if (this.actors[name]) {
        throw "Actor '" + name + "' already exists.";
      }
      this.actors[name] = actor;
      this.queue[name] = [];
    } else {
      throw "No draw function for actor '" + name + "' :(";
    }
    return this;
  };

  /*
    Animator.animate(actor, duration, change)
  
    Queue an animation of the properties of the specified actor according to the object
    change over the time of duration, in milliseconds.
  
    The properties of the change object must correspond to the properties of the actor.
  */


  Animator.prototype.animate = function(actor, duration, change) {
    var item;
    if (!this.actors[actor]) {
      throw "No actor named " + actor;
    }
    item = {};
    item.elapsed = 0;
    item.type = Animator.prototype.ANIMATE;
    item.duration = duration;
    item.change = change;
    item.easing = 'linear';
    item.actor = actor;
    this.queue[actor].push(item);
    this.start();
    return this;
  };

  /*
    Animator.callback(callback, [ctx = this])
  
    Queue a callback function, with an optional context. If no context is specified,
    the context is the animator object.
  */


  Animator.prototype.callback = function(actor, callback, ctx) {
    var item;
    if (ctx == null) {
      ctx = this;
    }
    item = {
      type: Animator.prototype.CALLBACK,
      callback: callback,
      context: ctx
    };
    this.queue[actor].push(item);
    this.start();
    return this;
  };

  /*
    Animator.delay(duration)
  
    Queue a delay of duration milliseconds.
  */


  Animator.prototype.delay = function(actor, duration) {
    var item;
    item = {
      type: Animator.prototype.DELAY,
      duration: duration
    };
    this.queue[actor].push(item);
    this.start();
    return this;
  };

  /*
    Animator.tick
    
    Processes the next frame and calls functions to draw it.
  */


  Animator.prototype.tick = function() {
    var actor, current, name, now, progress, property, queue;
    if (this.running) {
      for (name in this.queue) {
        queue = this.queue[name];
        if (queue.length !== 0) {
          current = queue[0];
          now = Date.now();
          switch (current.type) {
            case Animator.prototype.ANIMATE:
              actor = this.actors[current.actor];
              if (!current.start) {
                current.start = now;
                current.originals = {};
                for (property in current.change) {
                  current.originals[property] = actor[property];
                }
              }
              progress = (now - current.start) / current.duration;
              if (progress >= 1) {
                progress = 1;
                current.start = null;
                queue.shift();
              }
              for (property in current.change) {
                actor[property] = this.easing[current.easing](current.originals[property], current.change[property], progress);
              }
              if (progress === 1) {
                this.tick();
              }
              break;
            case Animator.prototype.CALLBACK:
              current.callback.apply(current.context);
              queue.shift();
              this.tick();
              break;
            case Animator.prototype.DELAY:
              if (!current.end) {
                current.end = now + current.duration;
              }
              if (now >= current.end) {
                queue.shift();
                this.tick();
              }
          }
        }
      }
      this.clear();
      this.draw();
      return this.start();
    }
  };

  /*
    Animator.draw
  
    Calls the draw function on all actors.
  */


  Animator.prototype.draw = function() {
    var actors, name, _results;
    actors = this.actors;
    _results = [];
    for (name in actors) {
      _results.push(actors[name].draw(actors[name]));
    }
    return _results;
  };

  /*
    Animator.start
  
    Start processing the queue
  */


  Animator.prototype.start = function() {
    var queue, run, _i, _len, _ref;
    run = false;
    _ref = this.queue;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      queue = _ref[_i];
      if (queue.length !== 0) {
        run = true;
      }
    }
    return this.running = run;
  };

  /*
    Animator.reset
  
    Reset the animator to a clean state. Empties the queue, gets rid of all actors, 
    calls clear.
  */


  Animator.prototype.reset = function() {
    var queue, _i, _len, _ref;
    _ref = this.queue;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      queue = _ref[_i];
      while (queue.length) {
        queue.shift();
      }
    }
    this.queue = {};
    this.actors = {};
    this.clear();
    this.draw();
    this.start();
    return this;
  };

  /*
    Animator.clear
  
    This function is called to clear the stage every time a new frame needs to be drawn.
    If you need a clear function, set it with animator.clear = function() {...}
  */


  Animator.prototype.clear = function() {
    console.log('Animator.clear not set.');
    this.clear = function() {
      return this;
    };
    return this;
  };

  /*
    Animator.easing
  
    A set of easing functions. All functions take three arguments: current, to and
    progress. From is the start value of the property being tweened, to is the
    value we are aiming for, and progress is a number between 1 and two representing
    how far along we are.
  */


  Animator.prototype.easing = {
    linear: function(from, to, progress) {
      return from + (to - from) * progress;
    }
  };

  Animator.prototype.ANIMATE = 1;

  Animator.prototype.CALLBACK = 2;

  Animator.prototype.DELAY = 3;

  return Animator;

})();
