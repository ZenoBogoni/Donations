import { Injectable } from "@angular/core";
import { GameComponent, State } from "./game.component";
import { CountUp } from "countup.js";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  start(this: GameComponent) {
    this.scoreContainer = new CountUp("counter", this.score);
    this.scoreContainer.update(this.score);

    const canvas = document.getElementById("game") as any,
      ctx = canvas.getContext("2d");

    const width = 300;
    const height = 400;

    const ballWidth = 10;
    const ballHeight = 10;

    const ballVelocity = 150;

    canvas.width = width;
    canvas.height = height;
    let lastTime = 0; // Variable to store the last frame time
    let isRunning = false; // Flag to control the game loop

    const bg = document.getElementById("bg") as any;
    bg.width = width;
    bg.height = height;

    const bCtx = bg.getContext("2d");

    bCtx.fillStyle = "transparent";
    bCtx.fillRect(0, 0, width, height);

    bCtx.setLineDash([6, 12]);
    bCtx.moveTo(width / 2, 0);
    bCtx.lineTo(width / 2, height);
    bCtx.strokeStyle = "#fff";
    bCtx.lineWidth = 4;
    bCtx.stroke();

    const view = document.getElementById("view");
    function scaleView() {
      const scale = Math.min(
        innerWidth / (width + 50),
        innerHeight / (height + 50)
      );
      const transform = "translate(-50%,-50%) scale(" + scale + ")";
      view.style.webkitTransform = transform;
      view.style.transform = transform;
    }
    scaleView();
    window.onresize = scaleView;

    function Rect(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.dx = 0;
      this.dy = 1;
    }

    Rect.prototype.bounce = function () {
      let dx = 0;

      if (this.y < this.h || this.y > height - this.h) {
        this.dy *= -1;
      }
      if (this.x < this.w || this.x > width - this.w) {
        dx = this.dx;
        this.dx *= -1;
      }
      return dx;
    };
    Rect.prototype.border = function () {
      this.x = Math.min(Math.max(0, this.x), width - this.w);
      this.y = Math.min(Math.max(0, this.y), height - this.h);
    };
    Rect.prototype.AABB = function (rect) {
      let dVectorLen = Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
      let dxCos = Math.abs(this.dx / dVectorLen);
      let dySin = Math.abs(this.dy / dVectorLen);

      return (
        this.x - dxCos * this.w < rect.x + rect.w &&
        this.y + dySin * this.h > rect.y &&
        this.y - dySin * this.h < rect.y + rect.h &&
        this.dx < 0 // ignore ball after bounce on the wall
      );
    };

    Rect.prototype.draw = function () {
      if (this === paddle) {
        ctx.fillStyle = "#ffd84d";
      } else {
        ctx.fillStyle = "#fff";
      }
      ctx.fillRect(this.x, this.y, this.w, this.h);
    };

    Rect.prototype.update = function (v, dt) {
      this.x += this.dx * v * dt;
      this.y += this.dy * v * dt;
    };

    const paddle = new Rect(10, 170, 10, 50);
    /*     const ai = new Rect(width - 10 - 20, 170, 10, 60); */

    // circle
    const ball = new Rect(width / 2, height / 2, ballWidth, ballHeight);
    ball.draw = function () {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.w, 0, Math.PI * 2);
      ctx.fill();
    };
    ball.dx = -0.5;
    ball.dy = 0.5;


    const input = new Input();

    function handleTouchMove(event) {
      if(isRunning) {
        event.preventDefault();
      }
      const touchPos = getTouchPos(canvas, event);
      paddle.y = touchPos.y
    }

    function getTouchPos(canvas, touchEvent) {
      const rect = canvas.getBoundingClientRect();

      return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top,
      };
    }

    function handleMouseMove(event) {
      const rect = canvas.getBoundingClientRect();
      const scale = (rect.bottom - rect.top) / (rect.bottom - rect.top - paddle.h);
      const mouseY = event.clientY - rect.top; // Get mouse Y relative to canvas
      paddle.y = mouseY * scale - paddle.h / 2;
    }

    canvas.addEventListener("touchmove", handleTouchMove, false);
    canvas.addEventListener("touchstart", handleTouchMove, false);
    document.addEventListener("mousemove", handleMouseMove, false);

    document.onkeydown = (e) => {
      if(e.code === "Space" && !isRunning)
        startGame()
    }
    canvas.onclick = () => {
      if (!isRunning) {
        startGame();
      }
    };


    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#aadd00";
      paddle.draw();
      /* ai.draw(); */
      ball.draw();
    }

    draw();
    ctx.globalAlpha = 0.6;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.fillRect(20, (height * 3) / 4 - 10, 260, 60);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText("Press Space or click to play", width / 2, (height * 3) / 4);

    function startGame() {
      isRunning = true; // Set the flag to true
      lastTime = performance.now(); // Initialize lastTime
      requestAnimationFrame(gameLoop); // Start the loop
      this.state = State.PLAYING;
    }
    const that = this;

    function gameLoop(currentTime) {
      if (!isRunning) return;
      // Calculate delta time
      const deltaTime = (currentTime - lastTime) / 1000; // Convert milliseconds to seconds
      lastTime = currentTime; // Update lastTime to the current frame time

      // Update game objects using deltaTime
      updateGame(deltaTime);

      // Render the game
      draw();

      // Request the next frame
      requestAnimationFrame(gameLoop);
    }

    function movePaddle(deltaTime) {
      const action = input.getDirection();
      if (action === "DOWN") {
        paddle.y += deltaTime * 250;
      } else if (action === "UP"){
        paddle.y += deltaTime * -250;
      }
    }

    function updateGame(deltaTime) {
      movePaddle(deltaTime);
      paddle.border();

      if (ball.AABB(paddle)) {
        that.audios["win"].play();
        that.score += Math.round(Math.abs(ball.dx) * 200);
        that.scoreContainer.update(that.score);
        ball.dx = Math.abs(ball.dx) + 0.1;
        ball.dy += ball.dy > 0 ? 0.1 : -0.1;

        ball.update(ballVelocity, deltaTime);
        const ball_bounce_dx = ball.bounce();
        ball.border();
        return;
      }
      ball.update(ballVelocity, deltaTime);
      const ball_bounce_dx = ball.bounce();
      ball.border();

      // console.log(ball_bounce_dx);
      if (ball_bounce_dx === 1) {
        that.audios["click"].play();
      } else if (ball_bounce_dx < 0) {
        that.audios["hit"].play();
        that.life.pop();
        if (that.life.length === 0) {
          isRunning = false;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          that.gameOver();
        }
      }
    }
  }
}

class Input {
  heldDirection: string[];
  constructor() {

    this.heldDirection = [];
    document.addEventListener("keydown", (e) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        this.OnArrowPressed("UP");
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        this.OnArrowPressed("DOWN");
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        this.OnArrowReleased("UP");
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        this.OnArrowReleased("DOWN");
      }
    });
  }

  getDirection() {
    return this.heldDirection[0];
  }

  OnArrowPressed(direction) {
    if (this.heldDirection.indexOf(direction) === -1) {
      this.heldDirection.unshift(direction);
    }
  }

  OnArrowReleased(direction) {
    const index = this.heldDirection.indexOf(direction);
    if (index === -1) {
      return;
    }
    this.heldDirection.splice(index, 1);
  }
}
