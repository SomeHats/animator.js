###
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
###

class Animator
  constructor: (raf = true) ->
    _ths = @
    @actors = {}
    @queue = {}
    @running = no

    if raf
      window.requestAnimationFrame = window.requestAnimationFrame or
                                     window.mozRequestAnimationFrame or
                                     window.webkitRequestAnimationFrame or
                                     window.msRequestAnimationFrame

      req = ->
        _ths.tick.apply _ths
        requestAnimationFrame req
      
      requestAnimationFrame req        

  ###
  Animator.register(name, actor)

  Registers a new actor to be animated. Actors are objects containing the properties
  to be animated, as well as a 'draw' function, which is called with the actor object
  as the argument whenever the actor needs to be drawn.
  ###
  register: (name, actor) ->
    if actor.draw
      if @actors[name]
        throw "Actor '#{name}' already exists."
      @actors[name] = actor
      @queue[name] = []
    else
      throw "No draw function for actor '#{name}' :("

    @

  ###
  Animator.animate(actor, duration, change)

  Queue an animation of the properties of the specified actor according to the object
  change over the time of duration, in milliseconds.

  The properties of the change object must correspond to the properties of the actor.
  ###
  animate: (actor, duration, change) ->
    if !@actors[actor]
      throw "No actor named #{actor}"
    item = {}
    item.elapsed = 0
    item.type = Animator::ANIMATE
    item.duration = duration
    item.change = change
    item.easing = 'linear'
    item.actor = actor

    @queue[actor].push item
    @start()

    @

  ###
  Animator.callback(callback, [ctx = this])

  Queue a callback function, with an optional context. If no context is specified,
  the context is the animator object.
  ###
  callback: (actor, callback, ctx = @) ->
    item = 
      type: Animator::CALLBACK
      callback: callback
      context: ctx

    @queue[actor].push item
    @start()

    @

  ###
  Animator.delay(duration)

  Queue a delay of duration milliseconds.
  ###
  delay: (actor, duration) ->
    item = 
      type: Animator::DELAY
      duration: duration

    @queue[actor].push item
    @start()

    @

  ###
  Animator.tick
  
  Processes the next frame and calls functions to draw it.
  ###
  tick: ->
    if @running
      for name of @queue
        queue = @queue[name]
        if queue.length isnt 0
          current = queue[0]
          now = Date.now()

          switch current.type
            when Animator::ANIMATE
              actor = @actors[current.actor]
              if !current.start
                current.start = now
                current.originals = {}
                for property of current.change
                  current.originals[property] = actor[property]

              progress = (now - current.start) / current.duration
              if progress >= 1 
                progress = 1
                current.start = null
                queue.shift()

              for property of current.change
                actor[property] = @easing[current.easing](current.originals[property],
                                                          current.change[property],
                                                          progress);

              if progress is 1
                @tick()

            when Animator::CALLBACK
              current.callback.apply current.context

              queue.shift()
              @tick()

            when Animator::DELAY
              if !current.end
                current.end = now + current.duration

              if now >= current.end
                queue.shift()
                @tick()
      @clear()
      @draw()
      @start()

  ###
  Animator.draw

  Calls the draw function on all actors.
  ###
  draw: ->
    actors = @actors
    for name of actors
      actors[name].draw actors[name]

  ###
  Animator.start

  Start processing the queue
  ###
  start: ->
    run = no
    for name of @queue
      if @queue[name].length isnt 0
        run = yes
    
    @running = run

  ###
  Animator.reset

  Reset the animator to a clean state. Empties the queue, gets rid of all actors, 
  calls clear.
  ###
  reset: ->
    @queue = {}
    @actors = {}
    @clear()
    @draw()
    @start()

    @

  ###
  Animator.clear

  This function is called to clear the stage every time a new frame needs to be drawn.
  If you need a clear function, set it with animator.clear = function() {...}
  ###
  clear: ->
    console.log 'Animator.clear not set.'
    @clear = -> @

    @

  ###
  Animator.easing

  A set of easing functions. All functions take three arguments: current, to and
  progress. From is the start value of the property being tweened, to is the
  value we are aiming for, and progress is a number between 1 and two representing
  how far along we are.
  ###
  easing:
    linear: (from, to, progress) ->
      from + (to - from) * progress

  ANIMATE: 1
  CALLBACK: 2
  DELAY: 3