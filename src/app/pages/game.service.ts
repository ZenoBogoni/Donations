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

    const paddle = new Rect(10, 170, 10, 50);
/*     const ai = new Rect(width - 10 - 20, 170, 10, 60); */

    // circle
    const ball = new Rect(width / 2, height / 2, 10, 10);
    ball.draw = function () {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.w, 0, Math.PI * 2);
      ctx.fill();
    };
    ball.dx = -0.5;
    ball.dy = 0.5;


    const framerate = 1000 / 40;
    let id;

    function listener(e) {
      paddle.y = e.clientY - canvas.getBoundingClientRect().top - 2 * paddle.h;
    }

    if (
      navigator.userAgent.match(
        /(Android|webOs|iPhone|iPad|BlackBerry|Windows Phone)/i
      )
    ) {
      canvas.ontouchmove = listener;

    } else {
      document.onmousemove = listener;
      // for touch
    }
    canvas.onclick = () => {
      if (id == null) {
        id = setInterval(loop, framerate);
      }
      this.state = State.PLAYING;
    };

    const that = this;

    function loop() {
      paddle.border();

      if (ball.AABB(paddle)) {
        that.score += Math.round(ball.dx * 500);
        that.scoreContainer.update(that.score);
        that.audios['win'].play();
        ball.dx = Math.abs(ball.dx) + 0.1;
        ball.dy += ball.dy > 0 ? 0.1 : -0.1;

        ball.move(4);
        ball.border();
        return;
      }
      ball.move(4);
      const ball_bounce_dx = ball.bounce();
      ball.border();

      console.log(ball_bounce_dx);
      if (ball_bounce_dx === 1) {
        that.audios['click'].play();

      } else if (ball_bounce_dx < 0) {
        that.audios['hit'].play();
        that.life.pop();
        if (that.life.length === 0) {
          clearInterval(id);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          that.gameOver();
        }
      } else {

      }

      draw();
    }

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
    ctx.fillText("Click to play", width / 2, (height * 3) / 4);
  }
}
