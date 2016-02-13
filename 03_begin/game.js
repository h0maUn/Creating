var Game = function() {
  // Set the width and height of the scene.
  this._width = 1920;
  this._height = 1080;
  this._center = {
    x: Math.round(this._width / 2),
    y: Math.round(this._height / 2)
  };

  // Setup the rendering surface.
  this.renderer = new PIXI.autoDetectRenderer(this._width, this._height);
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

    // Begin the first frame.
    requestAnimationFrame(this.tick.bind(this));
  },

  /**
   * Setup the background image.
   */
  setupBg: function() {
    // return;
    // Create the texture.
    var bg = new PIXI.Sprite.fromImage('./images/bg.jpg');

    // Position the background in the center;
    bg.anchor.x = 0.5;
    bg.anchor.y = 0.5;
    bg.position.x = this._center.x;
    bg.position.y = this._center.y;

    // Mount onto the stage.
    this.stage.addChild(bg);
  },

  /**
   * Build the main menu screen.
   */
  setupMenu: function() {
    // Create game name display.
    var name = new PIXI.Text('Stone Samurai', {
      font: 'bold 100px Arial',
      fill: '#7da6de',
      stroke: 'black',
      strokeThickness: 8
    });
    name.anchor.x = 0.5;
    name.anchor.y = 0.5;
    name.position.x = this._center.x;
    name.position.y = 100;

    // Create the button graphic.
    var button = new PIXI.Graphics();
    window.test = button;
    button.lineStyle(10, 0x000000);
    button.beginFill(0xFFD800);
    button.drawCircle(this._center.x, this._center.y, 150);
    button.endFill();

    // Create the play icon.
    var icon = new PIXI.Graphics();
    icon.beginFill(0x000000);
    icon.moveTo(this._center.x + 100, this._center.y);
    icon.lineTo(this._center.x - 60, this._center.y - 80);
    icon.lineTo(this._center.x - 60, this._center.y + 80);
    icon.endFill();

    // Add the button to the stage.
    button.addChild(icon);
    this.stage.addChild(button);
    this.stage.addChild(name);

    // Turn this into a button.
    button.interactive = true;
    button.buttonMode = true;
    button.click = function() {
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
      font: 'bold 40px Arial',
      fill: '#fff',
      stroke: 'black',
      strokeThickness: 6,
      align: 'left'
    });
    this.score.position.x = 20;
    this.score.position.y = 20;
    this.stage.addChild(this.score);

    // Setup the lives display.
    this._lives = 5;
    this.lives = new PIXI.Text('♥  ' + this._lives, {
      font: 'bold 40px Arial',
      fill: '#fff',
      stroke: 'black',
      strokeThickness: 6,
      align: 'left'
    });
    this.lives.position.x = 26;
    this.lives.position.y = 70;
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
        var rock = new PIXI.Sprite.fromImage('./images/' + (Math.random() > 0.5 ? 'stone01' : 'stone02') + '.png');
        // rock.scale = (33 + Math.random() * 67) / 100;
        rock.position.x = Math.round(Math.random() * this._width);
        rock.position.y = this._height + 100;
        rock.anchor.x = 0.5;
        rock.anchor.y = 0.5;

        // Make the rock clickable.
        rock.interactive = true;
        rock.buttonMode = true;
        rock.click = this.explodeRock.bind(this, rock);

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
            // Remove the stone from the stage.
            this.stage.removeChild(stone);

            // Remove a life.
            this._lives--;
            this.lives.setText('♥  ' + this._lives);

            // End game if out of lives.
            if (this._lives <= 0) {
              this.endGame();
            }
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
    // Stop tweening the rock.
    rock._tween1.stop();
    rock._tween2.stop();
    this.stage.removeChild(rock);

    // Create several smaller rocks.
    for (var i=0; i<4; i++) {
      // Setup the rock sprite.
      var piece = new PIXI.Sprite.fromImage(rock.texture.baseTexture.imageUrl);
      piece.width = Math.round(piece.texture.width * 0.33);
      piece.height = Math.round(piece.texture.height * 0.33);
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
   * Fires at the end of the game loop to reset and redraw the canvas.
   */
  tick: function(time) {
    // Update tweens.
    TWEEN.update(time);

    // Render the stage for the current frame.
    this.renderer.render(this.stage);

    // Begin the next frame.
    requestAnimationFrame(this.tick.bind(this));
  }
};