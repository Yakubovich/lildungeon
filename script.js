var canvasWidth = 700;
var canvasHeight = 500;

/* default speed */
var SPEED = 2.2;
var PLAYER_SPEED = 3;

/* directions */
var UP = 0;
var LEFT = -1;
var RIGHT = 1;
var DOWN = 2;

/* positions */

var POS_TOP = new Position (canvasWidth/2,0);
var POS_BOTTOM = new Position (canvasWidth/2,canvasHeight);
var POS_LEFT = new Position (0,canvasHeight/2);
var POS_RIGHT = new Position (canvasWidth,canvasHeight/2);

/* sprite Types */
var CHAR = 0;
var WALL = 1;
var ZOMBIE = 2;
var DEAD = 3;
var SHOTGUN = 4;
var ITEM = 5;
var FOLLOWER = 6;

var interval;
var ctx;
var score;
var shotgunPresent;
var player;
var ammo;
var sprites;
var time;

$(document).ready(function() {

  init();

  ctx = $('#game')[0].getContext('2d');

  /* Map Building */
  var hold = false;
  $("#game").mousedown(function(e){
    hold = true;
  });

  $(document).mouseup(function(e){
    hold = false;
  });

  $("#game").mousemove(function(e){
    var hit = false;
    if (hold) {
      var x = Math.floor((e.pageX - this.offsetLeft) / 10) * 10;
      var y = Math.floor((e.pageY - this.offsetTop) / 10) * 10;
      var wall = new Wall({ width: 10, height: 10, xPos: x, yPos: y });
      for (var i = 0; i < sprites.length && !hit; i++)
        if (hitTest(wall, sprites[i]))
          hit = true;
      if (!hit) {
        sprites.push(wall);
        wall.nextFrame();
      }
    }
  });

  $("#game").fadeIn();

  $("#clear").click(function(){
    sprites = [];
    initWalls();
    draw();
    clearInterval(interval);
  });

  $("#reset").click(function(){
    $("#game").fadeOut(function() {
      $("#game").removeClass("gray-out").show();
      init();
    });
  });
});

function init () {
  time = 0;
  ammo = 1;
  score = 0;
  sprites = [];
  shotgunPresent = false;
  $("#ammo").html(ammo);
  $("#score").html(score);
  $("#game").attr("width", canvasWidth);
  $("#game").attr("height", canvasHeight);

  /* Initialize player */
  player = new Character({ src:    "ch-hero.png",
                           width:  24,
                           height: 33,
                           xPos:   canvasWidth/2,
                           yPos:   3,
                           stop:   true,
                           speed:  PLAYER_SPEED
                         });
  sprites.push(player);
  
  initWalls();

  /* Place some sprites in non-colliding positions around the map */
  for (var i = 0; i < 30; i++) {
    if (i == 0)
      addChar(ZOMBIE);
    else
      addChar(CHAR);
  }

  /* Start draw loop */
  clearInterval(interval);
  interval = setInterval(draw,50);

}

function initWalls () {
  /* Initialize walls */
  sprites.push(new Wall({ width: 10, height: canvasHeight/2, xPos: 0, yPos: 0 }));
  sprites.push(new Wall({ width: 10, height: canvasHeight/2, xPos: canvasWidth - 10, yPos: 0 }));
  sprites.push(new Wall({ width: 10, height: canvasHeight/2, xPos: 0, yPos: canvasHeight/2 + 40 }));
  sprites.push(new Wall({ width: 10, height: canvasHeight/2, xPos: canvasWidth - 10, yPos: canvasHeight/2 + 40 }));
  sprites.push(new Wall({ width: canvasWidth / 2, height: 10, xPos: 0, yPos: 0 }));
  sprites.push(new Wall({ width: canvasWidth / 2, height: 10, xPos: 0, yPos: canvasHeight - 10 }));
  sprites.push(new Wall({ width: canvasWidth / 2, height: 10, xPos: canvasWidth/2 + 40, yPos: 0 }));
  sprites.push(new Wall({ width: canvasWidth / 2, height: 10, xPos: canvasWidth/2 + 40, yPos: canvasHeight - 10 }));
}

/* Place a new character or zombie sprite in a random, non-colliding position */
function addChar (type, position, direction) {
  var guy, hit;
  hit = true;
  while (hit) {
    guy = new Character({ src: "ch-guy.png",
                          width:  24,
                          height: 33,
                          xPos:   position ? position.x : Math.round(Math.random() * canvasWidth),
                          yPos:   position ? position.y : Math.round(Math.random() * canvasHeight)
                        });

    if (type == ZOMBIE)
      guy.zombify();

    hit = false;
    for (var j = 0; j < sprites.length && !hit; j++)
      if (hitTest(guy, sprites[j]) && sprites[j].type == WALL)
        hit = true;
  }
  if (direction)
    guy.direction = direction;
  sprites.push(guy);
}

/* Returns true if r1 and r2 are overlapping */
function hitTest (r1, r2) {
  if ((r1.position.x + r1.width > r2.position.x) &&
      (r1.position.x < r2.position.x + r2.width) &&
      (r1.position.y + r1.height > r2.position.y) &&
      (r1.position.y < r2.position.y + r2.height))
     return true;
  else
     return false;
}

/* Like Math.round(num), but faster */
function quickRound (num) {
  return (0.5 + num) << 0;
}

/* The draw loop */
function draw() {

  time++;

  ctx.clearRect(0,0,canvasWidth,canvasHeight);

  if (sprites.length < 300) {
    if (Math.random() > 0.995) {
      for (var i = 0; i < 5; i++)
        addChar(CHAR, POS_LEFT, RIGHT);
    }

    if (Math.random() > 0.995) {
      for (var i = 0; i < 5; i++)
        addChar(CHAR, POS_RIGHT, LEFT);
    }

    if (Math.random() > 0.995) {
      for (var i = 0; i < 5; i++)
        addChar(CHAR, POS_TOP, DOWN);
    }

    if (Math.random() > 0.995) {
      for (var i = 0; i < 5; i++)
        addChar(CHAR, POS_BOTTOM, UP);
    }
  }

  /* There's a 0.5% chance for a shotgun to be placed on the map, unless already present */
  if (Math.random() > 0.99 && !shotgunPresent) {
    var shotgun = new Sprite({ type: SHOTGUN, src: "shotgun.png", width: 24, height: 7, xPos: Math.random() * canvasWidth, yPos: Math.random() * canvasHeight });
    $(sprites).each(function() {
      if (this.type == WALL && hitTest(this, shotgun)) {
        shotgunPresent = true;
      }
    });
    if (!shotgunPresent) {
      sprites.push(shotgun);
      shotgunPresent = true;
    }
  }

  /* Iterate through the sprites */
  for (var i = 0; i < sprites.length; i++) {

    /* Change direction */
    if (sprites[i] != player && sprites[i].type != DEAD && Math.random() > sprites[i].turnProb)
      sprites[i].randomDir();

    /* Don't run off the map */
    if (sprites[i].position.x + sprites[i].width >= canvasWidth || sprites[i].position.x <= 0 || sprites[i].position.y + sprites[i].height >= canvasHeight || sprites[i].position.y <= 0)
      sprites[i].reverse();

    /* Collision detection */
    var elementToRemove = -1;
    for (var j = i + 1; j < sprites.length; j++) {
      if (hitTest(sprites[i], sprites[j])) {
        if (sprites[i].type == SHOTGUN && sprites[j] == player) {
          ammo += 5;
          $("#ammo").html(ammo);
          shotgunPresent = false;
          elementToRemove = i;
        } else if (sprites[j].type == SHOTGUN && sprites[i] == player) {
          ammo += 5;
          $("#ammo").html(ammo);
          shotgunPresent = false;
          elementToRemove = j;
        } else if (sprites[i].type == WALL) {
          sprites[j].reverse();
          sprites[j].frustration+=10;
        } else if (sprites[j].type == WALL) {
          sprites[i].reverse();
          sprites[i].frustration += 10;
        } else if (sprites[i].type == ZOMBIE || sprites[j].type == ZOMBIE) {
          sprites[i].zombify();
          sprites[j].zombify();
          if (sprites[i] == player || sprites[j] == player) {
            $("#game").addClass("gray-out");
          }
        } else {
          if (sprites[i] == player && sprites[j].type == CHAR) {
            score++;
            sprites[j].type = FOLLOWER;
            $("#score").html(score);
          } else if (sprites[j] == player && sprites[i].type == CHAR) {
            score++;
            sprites[i].type = FOLLOWER;
            $("#score").html(score);
          }
        }
      }
    }

    if (elementToRemove >= 0)
      sprites.splice(elementToRemove,1);
    
    if (sprites[i].image.loaded) {
      sprites[i].nextFrame();
    }
  }


  /* Sort by Y position so that lower sprites overlap higher ones */
  sprites.sort(function(a, b) {
    var a1 = a.position.y + a.height, b1 = b.position.y + b.height;
    if (a1 == b1)
      return 0;
    return a1 > b1 ? 1 : -1;
  });
}

Function.prototype.inheritsFrom = function (parentClass) {
  this.prototype = new parentClass();
  this.prototype.constructor = this;
  this.prototype.parent = parentClass.prototype;
  return this;
}

/* THE POSITION CLASS */
/* Represents a point on the canvas */
/* Required: x and y float coordinates */
function Position (x, y) {
  this.x = x;
  this.y = y;
  this.position = this;
}

Position.prototype.add = function(p2) {
  this.x += p2.x;
  this.y += p2.y; 
}

Position.prototype.subtract = function(p2) {
  this.x -= p2.x;
  this.y -= p2.y; 
}

Position.prototype.distanceTo = function(p2) {
  var dx = this.x - p2.x;
  var dy = this.y - p2.y;
  return Math.sqrt((dx * dx) + (dy * dy));
}


/* THE RECT CLASS */
/* Represents a rectangular object that can be rendred on the canvas */
/* Required: xPos, yPos, width, height */
function Rect (args) {
  this.type = WALL;
  this.image = new Object ();
  this.image.loaded = true;
  if (args) {
    this.position = new Position(args.xPos, args.yPos);
    this.width = args.width;
    this.height = args.height;
  }
}

Rect.prototype.nextFrame = function() {
  ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
};

Rect.prototype.reverse = function() {};
Rect.prototype.zombify = function() {};



/* THE WALL CLASS */
/* For now, the same as a Rectangle */
/* Required: xPos, yPos, width, height */
function Wall(args) {
  this.parent.constructor.call(this, args);
}

Wall.inheritsFrom(Rect);



/* THE SPRITE CLASS */
/* Represents a 2D bitmap (e.g. weapon, character) */
function Sprite (args) {
  if (args) {
    this.type = args.type;
    this.position = new Position(args.xPos, args.yPos);
    this.width = args.width;
    this.height = args.height;
    this.image = new Image ();
    this.image.src = args.src;
    this.image.onload = function() {
      this.loaded = true;        
    };
  }
}

Sprite.inheritsFrom(Rect);

Sprite.prototype.nextFrame = function() {
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


/* THE CHARACTER CLASS */
/* Requied args:  src, width, height, xPos, yPos */
/* Optional args: turnprob, totalframes, speed, stop */
function Character(args) {
  this.parent.constructor.call(this, args);
  this.frame = 0;
  this.oldPosition = new Position(args.xPos, args.yPos);
  this.movement = new Position(0,0);
  this.frustration = 0;
  this.type = CHAR;
  this.turnProb = args.turnprob ? args.turnprob : 0.95;
  this.totalframes = args.totalframes ? args.totalframes : 3;
  this.speed = args.speed ? args.speed : SPEED;
  this.stop = args.stop ? true : false; 
  this.randomDir();
};

Character.inheritsFrom(Sprite);

Character.prototype.zombify = function() {
  if (this.type != DEAD) {
    this.type = ZOMBIE;
    this.speed = 2;
    this.image.src = "ch-zombie.png";
  }
}

Character.prototype.goTo = function(target) {
  var delta = new Position(target.x, target.y - 5);
  delta.subtract(this.position);
  var angle = Math.atan2(delta.y, delta.x);
  this.movement.x = Math.cos(angle) * this.speed;
  this.movement.y = Math.sin(angle) * this.speed;
  
  if (angle > 0) {
    if (angle > 3 * Math.PI / 4)
      this.direction = LEFT;
    else if (angle > Math.PI / 4)
      this.direction = DOWN;
    else
      this.direction = RIGHT;
  } else {
    if (angle > - Math.PI / 4)
      this.direction = RIGHT;
    else if (angle > -3 * Math.PI / 4)
      this.direction = UP;
    else
      this.direction = LEFT;
  }
}

Character.prototype.randomDir = function() {
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
}

Character.prototype.reverse = function() {
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
}

Character.prototype.drawFrame = function(row, col) {
  if (row >= 0) {
    ctx.drawImage(this.image, 
                  this.width * col,
                  row * this.height,
                  this.width,
                  this.height,
                  quickRound(this.position.x),
                  quickRound(this.position.y),
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
                  -quickRound(this.position.x) - this.width,
                  quickRound(this.position.y),
                  this.width,
                  this.height); 
    ctx.restore();
  }
}

Character.prototype.nextFrame = function() {
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

  if (this.type == FOLLOWER || (this.type == ZOMBIE && this.frustration < 100 && Math.random() > 0.95)) {
    if (this.position.distanceTo(player.position) < 10) {
      this.stop = true;
    } else {
      this.stop = false;
      this.goTo(player.position);
    }
  } else if (!this.stop) {
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
  this.position.add(this.movement);

  if (this.stop) {
    this.frame = 0;
  } else if (time % 2 == 0) {
    this.frame++;
    if (this.frame == this.totalframes)
      this.frame = 0;
  }
}


/* KEY PRESS EVENT HANDLER */
/* Used only for shooting (space key) */
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

/* THE KEY DOWN EVENT HANDLER */
/* Used for controlling the player with the arrow keys */
$(document).keydown(function(e) {
  if (player.type != ZOMBIE)
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

/* THE KEY UP EVENT HANDLER */
/* Stop the player when a key is no longer pressed */
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

