var virtualGuitar = false;

alert(new Date());
var _originalGameH = window.innerHeight* window.devicePixelRatio;
var _gameW = window.innerWidth* window.devicePixelRatio;
var _gameH = window.innerHeight* window.devicePixelRatio;


var _tSize = new Vector2(128, 128);
var _pSize = new Vector2(128, 256);

//Колиество клеток от предыдщего создания объекта
var ticker = 0;
//Количество клеток, на котором тикер обнуляется и создается новое препятствие
var tickerLimit = 10;
//Состояние создания препятсвия (3 этапа для создания границ земли и самого препятствия)
var obstacleCreationState = 0;
//Тип препятствия (0 лава 1 блок)
var obstacleType = 0;

var playerLost, gameStarted, lives, currentNote, jumpNote, duckNote, playerYVelocity, playerIsJumping, playerIsDuck, points, pointsSprites;

var gravity = 1;

frequencies = [];

var gemDeployed, coinDeployed, fishDeployed;

// true после столкновения, чтобы не сразу дох
var playerIsCurrentlyHit = false;
// true после подбора бриллианта, чтобы пчелка свалила
var gemIsCurrentlyHit = false;

var levelNotes = ["A", "D"];

var stringFrequencies = [659.26, 493.88, 392.00, 293.66, 220.00, 164.82]

var mouseKeyPressActivated = false;

var gameRestarts = false;

var restartTimeout;
// var _pRatio = window.devicePixelRatio;

var numbersFrames = [49, 41, 33, 25, 17, 9, 1, 56, 48, 40]; 

var GameState = function(game) {

};
var game = new Phaser.Game(_gameW, _originalGameH, Phaser.WEBGL, 'game');
game.state.add('game', GameState, true);

GameState.prototype.preload = function() {
    if (gameRestarts) return false;
    console.log("preload");
	//this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.load.spritesheet('ground', "/spritesheets/spritesheet_ground.png", _tSize.x, _tSize.y, -1, 0, 0);
    game.load.spritesheet('player', "/spritesheets/player_walk2.png", _pSize.x, _pSize.y, -1, 0, 0);
    game.load.spritesheet('bee', "/spritesheets/enemy.png", _tSize.x, _tSize.y, -1, 0, 0);
    game.load.spritesheet('fish', "/spritesheets/fish.png", _tSize.x, _tSize.y, -1, 0, 0);
    game.load.spritesheet('hud', '/spritesheets/spritesheet_hud.png', _tSize.x, _tSize.y, -1, 0, 0);
    
    //game.load.image('mushroom', '/spritesheets/enemy.png');
};


// Setup the example
GameState.prototype.create = function() {
    playerLost = false;
    gameStarted = false;
    lives = 3;
    ticker = 0;
    currentNote = false;

    jumpNote = "D";
    duckNote = "A";
    playerYVelocity = 0;
    playerIsJumping = false;
    playerIsDuck = false;
    gemDeployed = false;
    coinDeployed = false;
    fishDeployed = false;

    points = 0;

    if (virtualGuitar) _gameH = window.innerHeight* window.devicePixelRatio - 150;
    else _gameH = _originalGameH;

    if (virtualGuitar) {
        toggleOscillator();
    }
    else {
        toggleLiveInput()
    }

   // this.game.camera.scale.setTo(0.5, 0.5);

   
    var style = { font: "65px Arial", fill: "#000000", align: "center" };

    this.fish = game.add.sprite(_gameW+_tSize.x,_gameH-_tSize.y*4, 'fish', 0);
    this.fish.anchor.setTo(0.5, 0.5);
    this.fish.frame = 0;


    this.startLabel = game.add.text(game.world.centerX, game.world.centerY, "Press to start", style);
    this.startLabel.anchor.setTo(0.5);

    this.jumpLabel = game.add.text(game.world.centerX, _gameH/2-120, jumpNote, style);
    this.duckLabel = game.add.text(game.world.centerX, _gameH/2-40, duckNote, style);

    var jumpSprite = game.add.sprite(game.world.centerX+100, _gameH/2-120, 'player', 0);
    jumpSprite.anchor.setTo(0.5);
    jumpSprite.scale.setTo(0.5);
    jumpSprite.frame = 4;


    var duckSprite = game.add.sprite(game.world.centerX+100, _gameH/2-40, 'player', 0);
    duckSprite.anchor.setTo(0.5);
    duckSprite.scale.setTo(0.5);
    duckSprite.frame = 6;
    this.game.stage.backgroundColor = 0xE0FBFE;

    // //Группы объектов
    this.ground = [];
    this.duckAndJumpGroup = this.game.add.group();
    this.duckAndJumpGroup.add(this.jumpLabel);
    this.duckAndJumpGroup.add(this.duckLabel);
    this.duckAndJumpGroup.add(jumpSprite);
    this.duckAndJumpGroup.add(duckSprite);
    this.duckAndJumpGroup.visible = false;

    
    for (var i = 0; i < Math.ceil(_gameW/_tSize.x)+4; i++) {
        var sprite = game.add.sprite(i*_tSize.x, _gameH, 'ground', 0)
        sprite.frame = 16;
        sprite.anchor.setTo(1, 1);
        this.ground.push(sprite);
    }

    
    this.player = game.add.sprite(_gameW/4, _gameH-_tSize.y, 'player', 0);
    this.player.anchor.setTo(0.5, 1);
    var walk = this.player.animations.add('walk', [0,1,2]);
    var dance = this.player.animations.add('dance', [2,3]);

    this.bee = game.add.sprite(60,_gameH-_tSize.y, 'bee', 0);
    this.bee.anchor.setTo(0.5, 1);
    var fly = this.bee.animations.add('fly');
    this.bee.animations.play('fly', 10, true);

    this.livesSprites = [];

    for (var i = 0; i < lives; i++) {
        var heart = game.add.sprite(_gameW-(_tSize.x*i),0, 'hud', 0);
        heart.anchor.setTo(1, 0);
        heart.frame = 16;
        this.livesSprites.push(heart)
    }


    this.gem = game.add.sprite(_gameW+_tSize.x,_gameH-_tSize.y*3, 'hud', 0);
    this.gem.anchor.setTo(1, 1);
    this.gem.frame = 4;

    this.coin = game.add.sprite(_gameW+_tSize.x,_gameH-_tSize.y*3, 'hud', 0);
    this.coin.anchor.setTo(1, 1);
    this.coin.frame = 32;


    pitches = [];
    frequencies = [];
    for (var i = 0; i < 1024; i++) {
        pitches.push(new Phaser.Rectangle(i*(_gameW/1024), _gameH/2, (_gameW/1024), 10));
        frequencies.push(0);
    }

    center = new Phaser.Rectangle(0, _gameH/2, _gameW, 10)


    pointsSprites = [];
    for (var i = 7; i >=0; i--) {
        var sprite = game.add.sprite(i*_tSize.x/2,0, 'hud', 0);
        sprite.anchor.setTo(0, 0);
        sprite.frame = numbersFrames[0];
        pointsSprites.push(sprite)
    }


    if (virtualGuitar) {
        console.log("virtualGuitar on");
        frets = [];
        for (var i = 0; i < 12; i++) {
            for (var j = 0; j < 6; j++) {
                frets.push(new Phaser.Rectangle(i*(_gameW/12), _originalGameH-150+j*(150/6), _gameW/12-5, 150/6-5));
            }
        }
    }

    gameRestarts = false;
}


GameState.prototype.update = function() {
    if(gameRestarts) return false;
   // console.log("update");
    var self = this;

    if (!gameStarted) {
        if (game.input.activePointer.isDown)
        {
            gameStarted = true;
            this.duckAndJumpGroup.visible = true;
            this.player.animations.play('walk', 10, true);
            this.startLabel.destroy();
        }
    }
    if (virtualGuitar) {
        if (game.input.activePointer.isDown && mouseKeyPressActivated === false)
        {
            mouseKeyPressActivated = true;
            var fret = Math.floor((game.input.x*12)/_gameW);
            var string = Math.floor(((game.input.y-_gameH)*6)/150)

            if (string>=0) {
                startOscilator(stringFrequencies[string])
                console.log(noteStrings[noteFromPitch(stringFrequencies[string])%12]);
                currentNote = noteStrings[noteFromPitch(stringFrequencies[string])%12];
            }
            

        }
        else if (game.input.activePointer.isUp) {
            mouseKeyPressActivated = false;
            currentNote = false;
        }
    }
    

    this.deployGem = function() {
        if (gemDeployed || gemIsCurrentlyHit) return false;
        this.gem.x = _gameW+_tSize.x;
        gemDeployed = true;
    }

    this.deployCoin = function() {
        if (coinDeployed) return false;
        this.coin.x = _gameW+_tSize.x;
        coinDeployed = true;
    }
    this.deployFish = function() {
        if (fishDeployed) return false;
        this.fish.x = _gameW+_tSize.x;
        fishDeployed = true;
    }

    if (playerIsCurrentlyHit) {
        this.bee.x+=1;
    }
    if (gemIsCurrentlyHit) {
        this.bee.x-=1;
    }

    var playerHit = function() {
        if (playerIsCurrentlyHit) return;
        lives--;
        playerIsCurrentlyHit = true;
        setTimeout(function() {
            playerIsCurrentlyHit = false;
        }, 1000);
    }
    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
    {
        currentNote = jumpNote;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
    {
         currentNote = duckNote;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        virtualGuitar=!virtualGuitar;
        gameRestarts = true;
        self.state.start('game');
    }

    if (playerIsJumping) {
        this.player.y+=playerYVelocity;
        playerYVelocity+=gravity;
        if (this.player.y>= _gameH-_tSize.y) {
            this.player.y =  _gameH-_tSize.y;
            playerIsJumping = false;
            this.player.animations.play('walk', 10, true);
        }
    }

    if (!playerLost && gameStarted) {

        if (!fishDeployed) {
            if (randomInteger(0,400)==0) {
                this.deployFish();
            }
        }

        points+=1;
        var digits = (""+points).split("");
        digits.reverse();
        pointsSprites.forEach(function(pSprite, index) {
            if (digits[index]!==undefined) {
                pSprite.frame = numbersFrames[parseInt(digits[index])];
            }
        });

        var self = this;
        if (gemDeployed) {
            this.gem.x-=10;
            if (this.gem.x<-_tSize.x) gemDeployed = false;
            if (gemCollisionCheck(this.player, this.gem)) {
                lives++;
                gemDeployed = false;
                this.gem.x = -_tSize.x;
                gemIsCurrentlyHit = true;
                setTimeout(function() {
                    gemIsCurrentlyHit = false;
                }, 1000);
            }
        }
        if (coinDeployed) {
            this.coin.x-=10;
            if (this.coin.x<-_tSize.x) coinDeployed = false;
            if (gemCollisionCheck(this.player, this.coin)) {
                points+=1000;
                coinDeployed = false;
                this.coin.x = -_tSize.x;
            }
        }

        if (fishDeployed) {
            this.fish.x-=2;
            if (this.fish.x<-_tSize.x) fishDeployed = false;
        }
        if (!playerIsJumping && !playerIsDuck && currentNote == jumpNote) {
            playerIsJumping = true;
            playerYVelocity = -20;
            this.player.frame = 4;
            this.player.animations.stop();

            var index = randomInteger(0,levelNotes.length-1);
            jumpNote = levelNotes[index];
            if (jumpNote===duckNote) jumpNote = levelNotes[(index+1)%levelNotes.length];

            this.duckAndJumpGroup.remove(this.jumpLabel);
            this.jumpLabel.destroy()
            var style = { font: "65px Arial", fill: "#000000", align: "center" };
            this.jumpLabel = game.add.text(game.world.centerX, _gameH/2-120, jumpNote, style);
             this.duckAndJumpGroup.add(this.jumpLabel)
        }
        if (!playerIsDuck && !playerIsJumping && currentNote == duckNote) {
            playerIsDuck = true;
            this.player.animations.stop();
            this.player.frame = 6;

            var index = randomInteger(0,levelNotes.length-1);
            duckNote = levelNotes[index];
            if (duckNote===jumpNote) duckNote = levelNotes[(index+1)%levelNotes.length];
            
            this.duckAndJumpGroup.remove(this.duckLabel);
            this.duckLabel.destroy()
            var style = { font: "65px Arial", fill: "#000000", align: "center" };
            this.duckLabel = game.add.text(game.world.centerX, _gameH/2-40, duckNote, style);
            this.duckAndJumpGroup.add(this.duckLabel)
            setTimeout(function() {
                playerIsDuck = false;
                self.player.animations.play('walk', 10, true);
            }, 700);
        }

        this.ground.forEach(function(sprite) {
            sprite.x-=10;

            if (sprite.x<-_tSize.x) {
                this.ground.shift();
                sprite.destroy();
                if (sprite.nonCountable==undefined) this.createObject();
            }

            if (sprite.isobstacle && collisionCheck(this.player, sprite)) {
                if (sprite.obstacleType==0) {
                    if (!playerIsJumping) {
                        playerHit();
                    }
                }
                else if (sprite.obstacleType==1) {
                    if (!playerIsDuck) {
                        playerHit();
                    }
                }
            }
        }, this);

        if (lives==0) {
            playerLost = true;
        }
    } else if (playerLost) {
        this.player.animations.stop();
        this.player.frame = 5;
        if (restartTimeout===undefined || restartTimeout===false) {
            this.duckAndJumpGroup.visible = false;
            
            var style = { font: "65px Arial", fill: "#000000", align: "center" };
            this.startLabel = game.add.text(game.world.centerX, game.world.centerY, "Try again!", style);
            this.startLabel.anchor.setTo(0.5);
            restartTimeout = setTimeout(function() {
                gameRestarts = true;
                restartTimeout = false;
                self.state.start('game');
            },2000);
        }
    }
    else if (!gameStarted) {
        this.player.animations.play('dance', 10, true);
    }

    this.livesSprites.forEach(function(liveSprite, index) {
        if ((index+1)>lives) {
            liveSprite.frame = 24;
        }
        else {
            liveSprite.frame = 16;
        }
    });
}

GameState.prototype.render = function() {
    //console.log(game.time.fps);
    // pitches.forEach(function(p, index){
    //     if (frequencies[index]>-Infinity) {
    //         p.y = _gameH/2-frequencies[index];
    //     }
    //     game.debug.geom(p,'#000000');
    // })

    // game.debug.geom(center,'#ff0000');

    if (virtualGuitar && !gameRestarts) {
        frets.forEach(function(fret) {
            game.debug.geom(fret,'#BB8044');
        });
    } 
}


GameState.prototype.createObject = function() {
    var last = this.ground[this.ground.length-1];
    if (last.nonCountable===true) {
        last = this.ground[this.ground.length-2];
    }
    var sprite = game.add.sprite(last.x+_tSize.x-2, _gameH, 'ground', 0)
    sprite.frame = 16;
    sprite.anchor.setTo(1, 1);
    this.ground.push(sprite);

    ticker++;

    if (lives<3 && ticker>=Math.floor(tickerLimit/2)) {
        if (randomInteger(0,10)==2) {
            this.deployGem();
        }
    }
    if(!gemDeployed && ticker>=Math.floor(tickerLimit/2)) {
        if (randomInteger(0,10)==2) {
             this.deployCoin();
        }
    }
    

    if (ticker>=tickerLimit) {
        obstacleType = randomInteger(0,1);
        if (obstacleType==0) {
            sprite.frame = 0;
        }
        
        ticker = 0;
        obstacleCreationState++;
    }
    else if(obstacleCreationState==1) {
        sprite.isobstacle=true;
        sprite.obstacleType = obstacleType;
        if (obstacleType==0) {
            sprite.frame = 10;
        }
        else {
            // console.log("floatingBlock");
            var floatingBlock = game.add.sprite(last.x+_tSize.x-2, _gameH-_tSize.x*2, 'ground', 0)
            floatingBlock.frame = 17;
            floatingBlock.anchor.setTo(1, 1);
            this.ground.push(floatingBlock);
            floatingBlock.nonCountable = true;
        }
        obstacleCreationState++;
    }
    else if(obstacleCreationState==2) {
        if (obstacleType==0) {
            sprite.frame = 32;
        }
        obstacleCreationState = 0;
    }
}

function randomInteger(min, max) {
  var rand = min + Math.random() * (max - min)
  rand = Math.round(rand);
  return rand;
}

function collisionCheck(player, obstacle) {
    if ((player.x+_pSize.x/2)>=(obstacle.x-_tSize.x+_pSize.x/2) && (player.x-_pSize.x/2)<=obstacle.x-_pSize.x) {
        return true;
    }
    return false;
}
function gemCollisionCheck(player, obstacle) {
    // this.player.anchor.setTo(0.5, 1);
    // this.gem.anchor.setTo(1, 1);

    if ((player.x+_pSize.x/2)>=(obstacle.x-_tSize.x) && 
        (player.x-_pSize.x/2)<=obstacle.x &&
        (player.y-_pSize.y/2)<=(obstacle.y) && 
        (player.y)>=obstacle.y-_tSize.y
        ) {
        return true;
    }
    return false;
}
