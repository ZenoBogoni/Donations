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

    const ballWidth = 10;
    const ballHeight = 10;

    const ballVelocity = 4;

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

      if (this.y < this.h || this.y > height - this.h) {
        this.dy *= -1;
      }
      if (this.x < this.w|| this.x > width - this.w) {
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


    const frametime = 1000 / 60;
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
        id = setInterval(loop, frametime);
      }
      this.state = State.PLAYING;
    };

    const that = this;

    function loop() {
      paddle.border();

      if (ball.AABB(paddle)) {
        that.audios['win'].play();
        that.score += Math.round(Math.abs(ball.dx) * 200);
        that.scoreContainer.update(that.score);
        ball.dx = Math.abs(ball.dx) + 0.1;
        ball.dy += ball.dy > 0 ? 0.1 : -0.1;


        ball.move(ballVelocity);
        const ball_bounce_dx = ball.bounce();
        ball.border();
        return;
      }
      ball.move(ballVelocity);
      const ball_bounce_dx = ball.bounce();
      ball.border();

      // console.log(ball_bounce_dx);
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
