import { Injectable } from "@angular/core";
import { GameComponent, State } from "./game.component";
import { CountUp } from "countup.js";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  start(this: GameComponent) {
    this.scoreContainer = new CountUp('counter', this.score);
    this.scoreContainer.update(this.score);

    const canvas = document.getElementById("game") as any,
      ctx = canvas.getContext("2d");

    const width = 300;
    const height = 400;

    canvas.width = width;
    canvas.height = height;

    const bg = document.getElementById("bg") as any;
    bg.width = width;
    bg.height = height;
    let scoreId = null;

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
    Rect.prototype.move = function (v) {
      this.x += this.dx * v;
      this.y += this.dy * v;
    };
    Rect.prototype.bounce = function () {
      let dx = 0;
      if (this.y < 10 || this.y > height - this.h - 10) {
        this.dy *= -1;
      }
      if (this.x < 10 || this.x > width - this.w - 10) {
        dx = this.dx;
        this.dx *= -1;
      }
      return dx;
    };
    Rect.prototype.border = function () {
      this.x = Math.min(Math.max(10, this.x), width - this.w - 10);
      this.y = Math.min(Math.max(10, this.y), height - this.h - 10);
    };
    Rect.prototype.AABB = function (rect) {
      return (
        this.x < rect.x + rect.w &&
        this.x + this.w > rect.x &&
        this.y < rect.y + rect.h &&
        this.y + this.h > rect.y
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

    const paddle = new Rect(10, 170, 10, 60);
    const ai = new Rect(width - 10 - 20, 170, 10, 60);

    // circle
    const ball = new Rect(width / 2, height / 2, 10, 10);
    ball.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.w, 0, Math.PI * 2);
      ctx.fill();
    };
    ball.dx = 1;

    const framerate = 1000 / 40;
    let id;

    function listener(e) {
      if (e.type === "keydown") {
        if (e.keyCode === 38) {
          paddle.dy = -1;
        }
        if (e.keyCode === 40) {
          paddle.dy = 1;
        }
      }
      /*
        if (id == null) {
            id = setInterval(loop, framerate);
        } else {
            paddle.dy *= -1;
        } */
    }

    if (
      navigator.userAgent.match(
        /(Android|webOs|iPhone|iPad|BlackBerry|Windows Phone)/i
      )
    ) {
      canvas.ontouchstart = listener;
    } else {
      document.onkeydown = listener;
      canvas.onclick = () => {
        scoreId = setInterval(() => {
          if (this.state === State.PLAYING) {
            this.score += 10;
            this.scoreContainer.update(this.score);

          }


        }, 500);
        if (id == null) {
          id = setInterval(loop, framerate);
        }
        this.state = State.PLAYING;
      };
    }

    const that = this;

    function loop() {
      paddle.move(4);
      paddle.border();

      if (ball.AABB(paddle)) {
        that.score += Math.round(Math.random() * 500);
        ball.dx = 1;
      }
      if (ball.AABB(ai)) {
        ball.dx = -1;
      }
      ball.move(4);
      const ball_bounce_dx = ball.bounce();
      ball.border();

      if (ball_bounce_dx === 1) {
      } else if (ball_bounce_dx === -1) {
        that.life.pop();
        if (that.life.length === 0) {
          clearInterval(id);
          clearInterval(scoreId);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          that.gameOver();
        }
      } else {

      }

      if (ai.y > ball.y + ball.h) {
        ai.dy = -1;
      }
      if (ai.y + ai.height < ball.y) {
        ai.dy = 1;
      }
      ai.move(4);
      ai.bounce();
      ai.border();

      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#aadd00";
      paddle.draw();
      ai.draw();
      ball.draw();
    }

    draw();
    ctx.globalAlpha = 0.6;
    ctx.font = "12px Monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.fillRect(20, (height * 3) / 4 - 10, 260, 60);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText("Click to play", width / 2, (height * 3) / 4);
    ctx.fillText(
      "Use W/S or UP/DOWN\nto change direction",
      width / 2,
      (height * 3) / 4 + 22
    );
  }
}
