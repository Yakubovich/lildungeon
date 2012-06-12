var score = 0;

var canvasWidth = 500;
var canvasHeight = 500;
var SPEED = 3;
var DOWN = 2;
var UP = 0;
var LEFT = -1;
var RIGHT = 1;

var CHAR = 0;
var WALL = 1;
var ZOMBIE = 2;
var DEAD = 3;
var SHOTGUN = 4;

var ctx;
var player;
var wolf;
var ammo;
var shotgunPresent = false;
var sprites = [];

$(document).ready(function() {

  ammo = 0;
  shotgunPresent = false;
  $("#ammo").html(ammo);

  /* Initialize player */
  player = new Sprite({ src:    "ch-hero.png",
                        width:  24,
                        height: 33,
                        xPos:   canvasWidth/2,
                        yPos:   3,
                        stop:   true
                      });
  sprites.push(player);

  /* Initialize walls */
  sprites.push(new Wall({ width: 200, height: 200, xPos: 200, yPos: 200 }));
  /*
  sprites.push(new Wall({ width: 400, height: 200, xPos: 300, yPos: 100 }));
  sprites.push(new Wall({ width: 400, height: 100, xPos: 0, yPos: 400 }));
  sprites.push(new Wall({ width: 30, height: 400, xPos: 0, yPos: 0 }));
  */

  /* Place some sprites in non-colliding positions around the map */
  var guy;
  var hit;
  for (var i = 0; i < 30; i++) {
    hit = true;
    while (hit) {
      hit = false;
      guy = new Sprite({ src: "ch-guy.png",
                         width:  24,
                         height: 33,
                         xPos:   Math.round(Math.random() * canvasWidth),
                         yPos:   Math.round(Math.random() * canvasHeight)
                       });
      if (i == 0) {
        guy.type = ZOMBIE;
        guy.speed = 2;
        guy.turnprob = 0.6;
        guy.image.src = "ch-zombie.png";
      }

      for (var i2 = 0; i2 < sprites.length; i2++) {
        if (hitTest(guy, sprites[i2])) {
          hit = true;
          break;
        }
      }
    }
    sprites.push(guy);
  }

  
  /*
  wolf = new Sprite({ src:         "wolf.png", 
                      width:       38,
                      height:      39,
                      xPos:        Math.round(Math.random() * canvasWidth), 
                      yPos:        Math.round(Math.random() * canvasHeight),
                      totalframes: 3,
                      speed:       1
                    });
  sprites.push(wolf);
  */

  /* Start draw loop */
  setInterval(draw,50);

  ctx = $('#game')[0].getContext('2d');
});



/* Returns true if r1 and r2 are overlapping */
function hitTest (r1, r2) {
  if ((r1.position.x + r1.width >= r2.position.x) &&
      (r1.position.x <= r2.position.x + r2.width) &&
      (r1.position.y + r1.height >= r2.position.y) &&
      (r1.position.y <= r2.position.y + r2.height))
     return true;
  else
     return false;
}


/* The draw loop */
function draw() {
  ctx.clearRect(0,0,500,500);
  var theSprite, theOtherSprite;

  if (Math.random() > 0.995 && !shotgunPresent) {
    var shotgun = new Item({ type: SHOTGUN, src: "shotgun.png", width: 24, height: 7, xPos: Math.random() * canvasWidth, yPos: Math.random() * canvasHeight });
    sprites.push(shotgun);
    shotgunPresent = true;
    var hit = false;
    $(sprites).each(function(){
      if (this != shotgun) {
        if (hitTest(this, shotgun)) {
          sprites.pop();
          shotgunPresent = false;
        }
      }
    });
  }

  for (var index = 0; index < sprites.length; index++) {

    theSprite = sprites[index];
    
    if (theSprite != player && Math.random() > theSprite.turnProb && theSprite.type != DEAD) {
      theSprite.randomDir();
    }

    if (theSprite.position.x + theSprite.width >= canvasWidth)
      theSprite.direction = LEFT;
    if (theSprite.position.x <= 0)
      theSprite.direction = RIGHT;
    if (theSprite.position.y + theSprite.height >= canvasHeight)
      theSprite.direction = UP;
    if (theSprite.position.y <= 0)
      theSprite.direction = DOWN;


    /* Collision detection */
    var elementToRemove = -1;
    for (var index2 = index + 1; index2 < sprites.length; index2++) {
      if (hitTest(theSprite, sprites[index2])) {
        if (theSprite.type == SHOTGUN && sprites[index2] == player) {
          ammo += 5;
          $("#ammo").html(ammo);
          shotgunPresent = false;
          elementToRemove = index;
        }
        if (sprites[index2].type == SHOTGUN && theSprite == player) {
          ammo += 5;
          $("#ammo").html(ammo);
          shotgunPresent = false;
          elementToRemove = index2;
        }
        if (theSprite.type == WALL) {
          sprites[index2].reverse();
          sprites[index2].frustration+=10;
        }
        if (sprites[index2].type == WALL) {
          theSprite.reverse();
          theSprite.frustration+= 10;
        }
        if (theSprite.type == ZOMBIE || sprites[index2].type == ZOMBIE) {
          theSprite.zombify();
          sprites[index2].zombify();
        } else {
          if (theSprite == player && sprites[index2].type != WALL && sprites[index2].type != DEAD) {
            sprites.splice(index2, 1);
            score++;
            $("#score").html(score);
          }
          if (sprites[index2] == player && theSprite.type != WALL && theSprite.type != DEAD) {
            sprites.splice(index, 1);
            score++;
            $("#score").html(score);
          }
        }
      }
    }
    
    if (theSprite.image.loaded) {
      theSprite.nextFrame();
    }
  }

  if (elementToRemove >= 0) {
    sprites.splice(elementToRemove,1);
  }

  /* Sort by Y position so that lower sprites overlap higher ones */
  sprites.sort(function(a, b) {
    var a1 = a.position.y + a.height, b1 = b.position.y + b.height;
    if (a1 == b1) return 0;
    return a1 > b1 ? 1 : -1;
  });
}

function Position (x, y) {
  this.x = x;
  this.y = y;
  this.position = this;

  this.add = function(p2) {
    this.x += p2.x;
    this.y += p2.y; 
  };

  this.subtract = function(p2) {
    this.x -= p2.x;
    this.y -= p2.y; 
  };

  this.distanceTo = function(p2) {
    var dx = this.x - p2.x;
    var dy = this.y - p2.y;
    return Math.sqrt((dx * dx) + (dy * dy));
  }; 
}

function Item (args) {
  this.type = args.type;
  this.position = new Position(args.xPos, args.yPos);
  this.width = args.width;
  this.height = args.height;
  this.image = new Image ();
  this.image.src = args.src;
  this.image.loaded = true;
  this.nextFrame = function () {
    ctx.drawImage(this.image,
                  0,
                  0,
                  this.width,
                  this.height,
                  this.position.x,
                  this.position.y,
                  this.width,
                  this.height);
  }
  this.reverse = function () {};
  this.zombify = function () {};
}

function Wall (args) {
  this.type = WALL;
  this.position = new Position(args.xPos, args.yPos);
  this.width = args.width;
  this.height = args.height;
  this.image = new Object ();
  this.image.loaded = true;
  this.nextFrame = function () {
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  };
  this.reverse = function () {};
  this.zombify = function () {};
}

/* Requied args: src, width, height, xPos, yPos */
/* Optional args: turnprob, totalframes, stop, speed */
function Sprite(args) {
  this.frame = 0;
  this.width = args.width;
  this.height = args.height;
  this.position = new Position(args.xPos, args.yPos);
  this.oldPosition = new Position(args.xPos, args.yPos);
  this.image = new Image();
  this.image.src = args.src;
  this.movement = new Position(0,0);
  this.frustration = 0;
  
  if (args.zombie)
    this.type = ZOMBIE;
  else
    this.type = CHAR;

  if (args.turnprob)
    this.turnProb = args.turnprob;
  else
    this.turnProb = 0.95;

  if (args.totalframes)
    this.totalframes = args.totalframes;
  else
    this.totalframes = 3;

  if (args.speed)
    this.speed = args.speed;
  else
    this.speed = SPEED;

  if (args.stop)
    this.stop = true;
  else
    this.stop = false;

  this.image.onload = function() {
    this.loaded = true;        
  };

  this.zombify = function() {
    if (this.type != DEAD) {
      this.type = ZOMBIE;
      this.speed = 2;
      this.image.src = "ch-zombie.png";
    }
  };

  this.goTo = function(target) {
    var delta = new Position(target.x, target.y);
    delta.subtract(this.position);
    var angle = Math.atan2(delta.y, delta.x);
    this.movement.x = Math.cos(angle) * this.speed;
    this.movement.y = Math.sin(angle) * this.speed;
    
    if (angle > 0) {
      if (angle > 3 * Math.PI / 4)
        this.direction = LEFT;
      else
        this.direction = DOWN;
    } else {
      if (angle > - Math.PI / 4)
        this.direction = RIGHT;
      else
        this.direction = UP;
    }
  };

  this.randomDir = function() {
    var random = Math.ceil(Math.random() * 4);
    switch(random){
      case 1:
        this.direction = UP;
        break;
      case 2:
        this.direction = DOWN;
        break;
      case 3:
        this.direction = LEFT;
        break;
      case 4:
        this.direction = RIGHT
        break;
    }
    this.frustration--;
  };

  /* Call this a sprite is intialized */
  this.randomDir();

  this.reverse = function() {
    if (this != player) {
      switch(this.direction) {
        case UP:
          this.direction = DOWN;
          break;
        case DOWN:
          this.direction = UP;
          break;
        case LEFT:
          this.direction = RIGHT;
          break;
        case RIGHT:
          this.direction = LEFT;
          break;
      }
    } else {
      this.stop = true;
    }

    this.xPos = this.xPosOld;
    this.yPos = this.yPosOld;
    this.position.x = this.oldPosition.x;
    this.position.y = this.oldPosition.y;
  };

  /* Draw a single frame */
  this.drawFrame = function(row, col) {
    if (row >= 0) {
      ctx.drawImage(this.image, 
                    this.width * col,
                    row * this.height,
                    this.width,
                    this.height,
                    Math.round(this.position.x),
                    Math.round(this.position.y),
                    this.width,
                    this.height); 
    } else {
      ctx.save();
      ctx.scale(-1,1);
      row = -row;
      ctx.drawImage(this.image,
                    this.width * col,
                    row * this.height,
                    this.width,
                    this.height,
                    -Math.round(this.position.x) - this.width,
                    Math.round(this.position.y),
                    this.width,
                    this.height); 
      ctx.restore();
    }
  };

  /* Gets called once every frame */
  this.nextFrame = function() {

    this.xPosOld = this.xPos;
    this.yPosOld = this.yPos;

    this.oldPosition.x = this.position.x;
    this.oldPosition.y = this.position.y;

    this.movement.x = 0;
    this.movement.y = 0;

    if (this.type == DEAD) {
      //temporary, will be part of sprite
      var img = new Image();
      img.src = "dead-zombie.png";
      ctx.drawImage(img, 
                    0,
                    0,
                    22,
                    10,
                    this.position.x,
                    this.position.y + 10,
                    22,
                    10); 
    } else {
      this.drawFrame(this.direction, this.frame);
    }

    if (this.type == ZOMBIE && this.frustration < 100 && Math.random() > 0.95) {
      this.goTo(player.position);
    } else {
      if (!this.stop) {
        switch(this.direction) {
          case DOWN: 
            this.movement.y = this.speed;
            break;
          case UP:
            this.movement.y = -this.speed;
            break;
          case LEFT:
            this.movement.x = -this.speed;
            break;
          case RIGHT:
            this.movement.x = this.speed
            break;
        }
      }
    }
    this.position.add(this.movement);

    if (this.stop) {
      this.frame = 0;
    } else {
      this.frame++;
      if (this.frame == this.totalframes)
        this.frame = 0;
    }

  };
};

$(document).keypress(function(e) {
  if (e.keyCode != 32 || ammo < 1)
    return 0;

  ammo --;

  $("#ammo").html(ammo);

  var lineOfFire;

  switch(player.direction) {
    case UP:
      lineOfFire = new Wall({ width: player.width, height: canvasHeight, xPos: player.position.x, yPos: player.position.y - canvasHeight });
      break;
    case DOWN:
      lineOfFire = new Wall({ width: player.width, height: canvasHeight, xPos: player.position.x, yPos: player.position.y});
      break;
    case LEFT:
      lineOfFire = new Wall({ width: canvasWidth, height: player.height, xPos: player.position.x - canvasWidth, yPos: player.position.y});
      break;
    case RIGHT:
      lineOfFire = new Wall({ width: canvasWidth, height: player.height, xPos: player.position.x, yPos: player.position.y});
      break;
  }

  var minDist = 10000;
  var dist;
  var victim = -1;
  $(sprites).each(function(index, element) {
    dist = player.position.distanceTo(this.position);
    if (hitTest(this, lineOfFire) && this != player && dist < minDist && this.type != DEAD) {
      victim = index;
      minDist = dist;
    }
  });
  if (victim > 0) {
    sprites[victim].stop = true;
    sprites[victim].type = DEAD;
  }
});

$(document).keydown(function(e) {
  switch(e.keyCode){
    case 40:
      player.direction = DOWN;
      player.stop = false;
      break;
    case 38:
      player.direction = UP;
      player.stop = false;
      break;
    case 39:
      player.direction = RIGHT;
      player.stop = false;
      break;
    case 37:
      player.direction = LEFT;
      player.stop = false;
      break;
  }
});

$(document).keyup(function(e) {
  switch(e.keyCode){
    case 40:
      if (player.direction == DOWN)
        player.stop = true;
      break;
    case 38:
      if (player.direction == UP)
        player.stop = true;
      break;
    case 39:
      if (player.direction == RIGHT)
        player.stop = true;
      break;
    case 37:
      if (player.direction == LEFT)
        player.stop = true;
      break;
  }
});
