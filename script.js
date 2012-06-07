var canvasWidth = 500;
var canvasHeight = 500;
var SPEED = 3;
var DOWN = 1;
var UP = -1;
var LEFT = -2;
var RIGHT = 2;

var ctx;
var player;
var wolf;
var sprites = [];

$(document).ready(function() {

  /* Initiate sprites */
  player = new Sprite({ src:    "bluelink.png",
                        width:  30,
                        height: 25,
                        xPos:   canvasWidth/2,
                        yPos:   3,
                        stop:   true
                      });
  sprites.push(player);
  for (var i = 0; i < 6; i++) {
    sprites.push(new Sprite({ src: "redlink.png",
                              width:  30,
                              height: 25,
                              xPos:   Math.round(Math.random() * canvasWidth),
                              yPos:   Math.round(Math.random() * canvasHeight)
                             }));
  }
  
  wolf = new Sprite({ src:         "wolf.png", 
                      width:       38,
                      height:      39,
                      xPos:        Math.round(Math.random() * canvasWidth), 
                      yPos:        Math.round(Math.random() * canvasHeight),
                      totalframes: 3,
                      speed:       1
                    });
  sprites.push(wolf);
  var drunk = new Sprite({ src:      "drunklink.png",
                           width:    30, 
                           height:   25,
                           xPos:     300,
                           yPos:     200,
                           turnprob: 0.6
                          });
  sprites.push(drunk);

  var wall = new Wall({ width: 300, height: 20, xPos: 100, yPos: 100 });
  sprites.push(wall);

  /* Start draw loop */
  setInterval(draw,50);

  ctx = $('#game')[0].getContext('2d');
});

function hitTest (r1, r2) {
  if ((r1.xPos + r1.width >= r2.xPos) &&
      (r1.xPos <= r2.xPos + r2.width) &&
      (r1.yPos + r1.height >= r2.yPos) &&
      (r1.yPos <= r2.yPos + r2.height))
     return true;
  else
     return false;
}


/* The draw loop */
function draw() {
  ctx.clearRect(0,0,500,500);
  var theSprite, theOtherSprite;
  for (var index = 0; index < sprites.length; index++) {

    theSprite = sprites[index];
    
    if (theSprite != player && Math.random() > theSprite.turnProb) {
      var random = Math.round(Math.random() * 4);
      switch(random){
        case 0:
          theSprite.direction = -1;
          break;
        case 1:
          theSprite.direction = 1;
          break;
        case 2:
          theSprite.direction = -2;
          break;
        case 3:
          theSprite.direction = 2;
          break;
      }
    }

    if (theSprite.xPos >= canvasWidth)
      theSprite.direction = LEFT;
    if (theSprite.xPos <= 0)
      theSprite.direction = RIGHT;
    if (theSprite.yPos >= canvasHeight)
      theSprite.direction = UP;
    if (theSprite.yPos <= 0)
      theSprite.direction = DOWN;

    if (theSprite == wolf) {
      if (theSprite.xPos < player.xPos + 40)
        theSprite.direction = RIGHT;
      if (theSprite.xPos > player.xPos - 40)
        theSprite.direction = LEFT;
      if (theSprite.yPos > player.yPos)
        theSprite.direction = UP;
      if (theSprite.yPos < player.yPos)
        theSprite.direction = DOWN;
    }

    /* Collision detection */
    for (var index2 = index + 1; index2 < sprites.length; index2++) {
      if (hitTest(theSprite, sprites[index2])) {
        theSprite.reverse();
        sprites[index2].reverse();
      }
    }
    
    if (theSprite.image.loaded) {
      theSprite.nextFrame();
    }
  }

  /* Sort by Y position so that lower sprites overlap higher ones */
  sprites.sort(function(a, b) {
    var a1 = a.yPos + a.height, b1 = b.yPos + b.height;
    if (a1 == b1) return 0;
    return a1 > b1 ? 1 : -1;
  });
}

function Wall (args) {
  this.xPos = args.xPos;
  this.yPos = args.yPos;
  this.width = args.width;
  this.height = args.height;
  this.image = new Object ();
  this.image.loaded = true;
  this.nextFrame = function () {
    ctx.fillRect(this.xPos, this.yPos, this.width, this.height);
  };
  this.reverse = function () {};
}

/* Requied args: src, width, height, xPos, yPos */
/* Optional args: turnprob, totalframes, stop, speed */
function Sprite(args) {
  this.frame = 0;
  this.width = args.width;
  this.height = args.height;
  this.xPos = args.xPos;
  this.yPos = args.yPos;
  this.xPosOld = args.xPos;
  this.yPosOld = args.yPos;
  this.direction = DOWN;
  this.image = new Image();
  this.image.src = args.src;

  if (args.turnprob)
    this.turnProb = args.turnprob;
  else
    this.turnProb = 0.95;

  if (args.totalframes)
    this.totalframes = args.totalframes;
  else
    this.totalframes = 11;

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

  this.reverse = function() {
    if (this != player)
      this.direction = -this.direction;
    else
      this.stop = true;

    this.xPos = this.xPosOld;
    this.yPos = this.yPosOld;
  };

  /* Draw a single frame */
  this.drawFrame = function(row, col) {
    if (row >= 0) {
      ctx.drawImage(this.image, 
                    this.width * col,
                    row * this.height,
                    this.width,
                    this.height,
                    this.xPos,
                    this.yPos,
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
                    -this.xPos - this.width,
                    this.yPos,
                    this.width,
                    this.height); 
      ctx.restore();
    }
  };

  /* Gets called once every frame */
  this.nextFrame = function() {

    this.xPosOld = this.xPos;
    this.yPosOld = this.yPos;

    switch(this.direction) {
      case DOWN: 
        this.drawFrame(0, this.frame);
        if (!this.stop)
          this.yPos += this.speed;
        break;
      case UP:
        this.drawFrame(1, this.frame);
        if (!this.stop)
          this.yPos -= this.speed;
        break;
      case LEFT:
        this.drawFrame(2, this.frame);
        if (!this.stop)
          this.xPos -= this.speed;
        break;
      case RIGHT:
        this.drawFrame(-2, this.frame);
        if (!this.stop)
          this.xPos += this.speed;
        break;
    }

    if (this.stop) {
      this.frame = 0;
    } else {
      this.frame++;
      if (this.frame == this.totalframes)
        this.frame = 0;
    }

  };
};

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
