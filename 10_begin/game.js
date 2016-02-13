var Game = function() {
  this.setupScale();

  // Setup listener for device orientation change.
  window.addEventListener('orientationchange', this.orientation.bind(this), false);

  // Setup shake event.
  var shake = new Shake();
  shake.start();
  window.addEventListener('shake', this.handleShake.bind(this), false);

  // Setup the rendering surface.
  this.renderer = new PIXI.autoDetectRenderer(this._width, this._height, {
    resolution: window.devicePixelRatio || 1
  });
  document.body.appendChild(this.renderer.view);

  // Create the main stage to draw on.
  this.stage = new PIXI.Stage();

  // Store rocks.
  this.rocks = [];

  // Start running the game.
  this.build();
};

Game.prototype = {
  /**
   * Build the scene and begin animating.
   */
  build: function() {
    // Draw the background.
    this.setupBg();

    // Setup the start screen.
    this.setupMenu();

    // Check the orientation.
    this.orientation();

    // Setup audio sprite.
    this.sound = new Howl({
      src: ['./audio/sounds.ogg', './audio/sounds.mp3'],
      sprite: {
        stone: [0, 480],
        bomb: [2000, 1612]
      }
    });

    // Begin the first frame.
    requestAnimationFrame(this.tick.bind(this));
  },

  /**
   * Setup the background image.
   */
  setupBg: function() {
    // Create the texture.
    var bg = new PIXI.Sprite.fromImage('./images/bg.jpg');

    // Position the background in the center;
    bg.anchor.x = 0.5;
    bg.anchor.y = 0.5;
    bg.position.x = this._center.x;
    bg.position.y = this._center.y;
    bg.width = Math.round(this._scale * 1920);
    bg.height = Math.round(this._scale * 1080);

    // Setup a rotate background and text.
    this.rotateBg = new PIXI.Graphics();
    this.rotateText = new PIXI.Text('ROTATE', {
      font: 'bold ' + Math.round(this._scale * 100) + 'px Arial',
      fill: '#7da6de'
    });
    this.rotateText.anchor.x = 0.5;
    this.rotateText.anchor.y = 0.5;
    this.rotateBg.addChild(this.rotateText);

    // Mount onto the stage.
    this.stage.addChild(bg);
  },

  /**
   * Build the main menu screen.
   */
  setupMenu: function() {
    // Create game name display.
    var name = new PIXI.Text('Stone Samurai', {
      font: 'bold ' + Math.round(this._scale * 100) + 'px Arial',
      fill: '#7da6de',
      stroke: 'black',
      strokeThickness: Math.ceil(this._scale * 8)
    });
    name.anchor.x = 0.5;
    name.anchor.y = 0.5;
    name.position.x = this._center.x;
    name.position.y = Math.round(this._scale * 150);

    // Create the button graphic.
    var button = new PIXI.Graphics();
    window.test = button;
    button.lineStyle(10, 0x000000);
    button.beginFill(0xFFD800);
    button.drawCircle(this._center.x, this._center.y, Math.round(this._scale * 150));
    button.endFill();

    // Create the play icon.
    var icon = new PIXI.Graphics();
    icon.beginFill(0x000000);
    icon.moveTo(this._center.x + Math.round(this._scale * 100), this._center.y);
    icon.lineTo(this._center.x - Math.round(this._scale * 60), this._center.y - Math.round(this._scale * 80));
    icon.lineTo(this._center.x - Math.round(this._scale * 60), this._center.y + Math.round(this._scale * 80));
    icon.endFill();

    // Add the button to the stage.
    button.addChild(icon);
    this.stage.addChild(button);
    this.stage.addChild(name);

    // Turn this into a button.
    button.interactive = true;
    button.buttonMode = true;
    button.click = button.tap = function() {
      document.body.style.cursor = 'default';
      this.stage.removeChild(button);
      this.stage.removeChild(name);
      this.startGame();
    }.bind(this);
  },

  /**
   * Start the gameplay.
   */
  startGame: function() {
    // Setup timer to throw random rocks.
    this.randomRocks();

    // Setup the points display.
    this._score = 0;
    this.score = new PIXI.Text('★ ' + this._score, {
      font: 'bold ' + Math.round(this._scale * 40) + 'px Arial',
      fill: '#fff',
      stroke: 'black',
      strokeThickness: Math.ceil(this._scale * 6),
      align: 'left'
    });
    this.score.position.x = Math.round(this._scale * 20);
    this.score.position.y = Math.round(this._scale * 20);
    this.stage.addChild(this.score);

    // Setup the lives display.
    this._lives = 5;
    this.lives = new PIXI.Text('♥  ' + this._lives, {
      font: 'bold ' + Math.round(this._scale * 40) + 'px Arial',
      fill: '#fff',
      stroke: 'black',
      strokeThickness: Math.ceil(this._scale * 6),
      align: 'left'
    });
    this.lives.position.x = Math.round(this._scale * 23);
    this.lives.position.y = Math.round(this._scale * 70);
    this.stage.addChild(this.lives);
  },

  /**
   * Game over!
   */
  endGame: function() {
    // Clear the stage.
    for (var i=0; i<this.rocks.length; i++) {
      if (this.rocks[i]) {
        this.rocks[i]._tween1.stop();
        this.rocks[i]._tween2.stop();
        this.stage.removeChild(this.rocks[i]);
      }
    }
    this.rocks = [];
    this.stage.removeChild(this.score);
    this.stage.removeChild(this.lives);

    // Cancel new rocks.
    clearTimeout(this.timer);

    // Show the start screen.
    this.setupMenu();
  },

  /**
   * Randomly fire a few rocks into the air every few seconds.
   */
  randomRocks: function() {
    var rand = Math.ceil(1000 + (Math.random() * 4) * 1000);
    this.timer = setTimeout(function() {
      // Generate a random number of rocks with varying properties.
      var num = Math.ceil(Math.random() * 3);
      for (var i=0; i<num; i++) {
        // Create the texture of the rock.
        var frame;
        var bomb = false;
        var rand = Math.random();
        if (rand < 0.33) {
          frame = {
            x: 0,
            y: 0,
            width: 158 * (window.devicePixelRatio || 1),
            height: 150 * (window.devicePixelRatio || 1)
          };
        } else if (rand < 0.66) {
          frame = {
            x: 180 * (window.devicePixelRatio || 1),
            y: 0,
            width: 152 * (window.devicePixelRatio || 1),
            height: 150 * (window.devicePixelRatio || 1)
          };
        } else {
          bomb = true;
          frame = {
            x: 355 * (window.devicePixelRatio || 1),
            y: 9 * (window.devicePixelRatio || 1),
            width: 102 * (window.devicePixelRatio || 1),
            height: 132 * (window.devicePixelRatio || 1)
          };
        };
        var img = PIXI.Texture.fromImage('./images/sprite' + (window.devicePixelRatio > 1 ? '@2x' : '') + '.png');
        var tex = new PIXI.Texture(img, frame);
        var rock = new PIXI.Sprite(tex);
        rock.position.x = Math.round(Math.random() * this._width);
        rock.position.y = this._height + Math.round(this._scale * 100);
        rock.anchor.x = 0.5;
        rock.anchor.y = 0.5;
        rock.width = Math.round(this._scale * rock.texture.width);
        rock.height = Math.round(this._scale * rock.texture.height);
        rock._bomb = bomb;

        // Make the rock clickable.
        rock.interactive = true;
        rock.buttonMode = true;
        rock.click = rock.tap = this.explodeRock.bind(this, rock);

        // Tween the rock with an easing function to simulate physics.
        var y1 = Math.round(50 + Math.random() * 500);
        rock._tween1 = new TWEEN.Tween(rock.position)
          .to({y: y1}, 3000)
          .easing(TWEEN.Easing.Cubic.Out)
          .start();
        rock._tween2 = new TWEEN.Tween(rock.position)
          .to({y: this._height + 100}, 3000)
          .easing(TWEEN.Easing.Cubic.In)
          .onComplete(function(stone) {
            this.loseLife(stone);
          }.bind(this, rock));
        rock._tween1.chain(rock._tween2);

        this.stage.addChild(rock);
        this.rocks.push(rock);
      }

      // Start the next timer.
      this.randomRocks();
    }.bind(this), rand);
  },

  /**
   * Create an explosion animation for when a stone is swiped.
   * @param  {PIXI.Sprite} rock Rock sprite to explode.
   */
  explodeRock: function(rock) {
    // End the game if a bomb is clicked.
    if (rock._bomb) {
      this.loseLife(rock);
      return;
    }

    this.sound.play('stone');

    // Stop tweening the rock.
    rock._tween1.stop();
    rock._tween2.stop();
    this.stage.removeChild(rock);

    // Create several smaller rocks.
    for (var i=0; i<4; i++) {
      // Setup the rock sprite.
      var img = PIXI.Texture.fromImage(rock.texture.baseTexture.imageUrl);
      var tex = new PIXI.Texture(img, rock.texture.frame);
      var piece = new PIXI.Sprite(tex);
      piece.width = Math.round(rock.width * 0.33);
      piece.height = Math.round(rock.height * 0.33);
      piece.anchor.x = 0.5;
      piece.anchor.y = 0.5;
      piece.position.x = rock.position.x;
      piece.position.y = rock.position.y;

      // Tween the rock.
      var x = (Math.random() > 0.5 ? '-' : '+') + Math.round(50 + Math.random() * 40);
      var y = (Math.random() > 0.5 ? '-' : '+') + Math.round(50 + Math.random() * 40);
      var t = 200 + Math.round(Math.random() * 100);
      var tween = new TWEEN.Tween(piece.position)
        .to({x: x, y: y}, t)
        .onComplete(function(obj) {
          this.stage.removeChild(obj);
        }.bind(this, piece))
        .start();

      // Add the rock to the stage.
      this.stage.addChild(piece);
    }

    // Update the score.
    this._score++;
    this.score.setText('★ ' + this._score);
  },

  /**
   * Callback fired when shake event is triggered to clear bombs.
   */
  handleShake: function() {
    // Loop through objects to find the active bomb.
    for (var i=this.rocks.length - 1; i>=0; i--) {
      if (this.rocks[i] && this.rocks[i]._bomb) {
        this.rocks[i]._bomb = null;
        this.explodeRock(this.rocks[i]);
        this.sound.play('bomb');
      }
    }
  },

  /**
   * Lose a life and check for end game.
   * @param  {PIXI.Sprite} rock Rock sprite to remove.
   */
  loseLife: function(rock) {
    // Remove the stone from the stage.
    this.stage.removeChild(rock);

    // Remove a life.
    this._lives--;
    this.lives.setText('♥  ' + this._lives);

    // End game if out of lives.
    if (this._lives <= 0) {
      this.endGame();
    }
  },

  /**
   * Setup the scale of the game.
   */
  setupScale: function() {
    // Set the width and height of the scene.
    this._width = document.body.clientWidth;
    this._height = document.body.clientHeight;
    this._center = {
      x: Math.round(this._width / 2),
      y: Math.round(this._height / 2)
    };

    // Determine the scale to use for all elements.
    this._scale = this._width / 1920;
    if (this._scale * 1080 < this._height) {
      this._scale = this._height / 1080;
    }
  },

  /**
   * Determine the orientation and adjust the display.
   */
  orientation: function() {
    setTimeout(function() {
      var w = document.body.clientWidth;
      var h = document.body.clientHeight;

      // Update the display based on orientation.
      if (w < h) {
        this.endGame();
        this.rotateBg.width = w;
        this.rotateBg.height = h;
        this.rotateBg.beginFill(0x000000);
        this.rotateBg.drawRect(0, 0, w, h);
        this.rotateBg.endFill();
        this.rotateText.position.x = w / 2;
        this.rotateText.position.y = h / 2;
        this.stage.addChild(this.rotateBg);
      } else {
        if (this.rotateBg) {
          this.stage.removeChild(this.rotateBg);
        }

        this.stage.removeChildren();
        this.setupScale();
        this.renderer.resize(this._width, this._height);
        this.setupBg();
        this.setupMenu();
      }
    }.bind(this), 0);
  },

  /**
   * Fires at the end of the game loop to reset and redraw the canvas.
   */
  tick: function(time) {
    // Update tweens.
    TWEEN.update();

    // Render the stage for the current frame.
    this.renderer.render(this.stage);

    // Begin the next frame.
    requestAnimationFrame(this.tick.bind(this));
  }
};