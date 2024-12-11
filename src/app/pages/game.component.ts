import { AfterViewInit, Component, OnInit } from "@angular/core";
import { CountUp } from 'countup.js';
import { SurveyService } from "./survey.service";
import { HttpClient } from "@angular/common/http";
import { combineLatest } from "rxjs";
import { PostSurvey } from "../data/post.survey";
import { Model, SurveyModel } from "survey-core";
import { PreSurvey } from "../data/pre.survey";
import { GameService } from "./game.service";
declare var $, bootstrap: any;
declare var SurveyTheme: any;



@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
})
export class GameComponent implements OnInit, AfterViewInit {
  observers = Math.round(Math.random() * 5);
  score = 0;
  scoreContainer: CountUp;
  TOTAL_LIVES = 4;
  life = new Array(this.TOTAL_LIVES).fill(0);
  internalState = +localStorage.getItem('state') || State.PRE;
  totalScore = 0;
  leaderboard = [];
  audios = {};
  status = State;
  machineCode = localStorage.getItem("machineCode");
  donation: Donation = {
    amount: 0,
    lives: 10,
    name: '',
    message: ''
  }
  incomingDonation: Donation = {
    amount: 2,
    lives: 0,
    name: 'Deleter',
    message: 'Good luck!'
  }
  currentMatch = 1;
  postSurvey: SurveyModel;
  preSurvey: SurveyModel;

  get state() {
    return this.internalState;
  }
  set state(v) {
    this.internalState = v;
    localStorage.setItem('state', v.toString());
  }

  get donationArray() {
    return new Array(Math.max(0, this.donation.lives - 1)).fill(0);
  }

  constructor(public http: HttpClient, private gameService: GameService) {}

  ngOnInit(): void {

    if (!this.machineCode || location.href.includes('force')) {
      this.machineCode = SurveyService.generateMachineCode();
      localStorage.setItem("machineCode", this.machineCode);
      this.state = State.PRE;
    }

    this.preSurvey = new Model(PreSurvey);
    this.preSurvey.showPrevButton = false;
    this.preSurvey.applyTheme(SurveyTheme.ContrastDark);
    this.preSurvey.cookieName = this.machineCode;
    this.preSurvey.onComplete.add(() => {
      this.state = State.TUTORIAL;
      this.sendData('pre', this.preSurvey).subscribe(() => {;
       this.start();
      });
    });
    this.postSurvey = new Model(PostSurvey);
    this.postSurvey.applyTheme(SurveyTheme.ContrastDark);
    this.postSurvey.showPrevButton = false;
    this.postSurvey.cookieName = this.machineCode;
    this.postSurvey.onComplete.add(() => {
      this.getLeaderboard();
      this.sendData('post', this.postSurvey).subscribe(() => {});
      this.http.put(SurveyService.getUrl(this.machineCode + '/totalScore'), this.totalScore).subscribe(() => {});
      this.state = State.LEADERBOARD;
    });

    this.http.get(SurveyService.getUrl('lastDonation')).subscribe((donation: Donation) => {
      this.incomingDonation = donation || this.incomingDonation;
    });

    setInterval(() => {
      if (Math.random() > 0.6) {
        this.observers += Math.round((Math.random() - 0.5) * 2);
        if (this.observers < 0) {
          this.observers = 0;
        }
      }
    }, 5000);
  }

  getLeaderboard() {
    this.http.get(SurveyService.getUrl('')).subscribe((data: any) => {
      this.leaderboard = (Object.values(data) as any[]).filter((e) => e.totalScore);
      this.leaderboard.push({
        totalScore: this.totalScore,
        name: 'You',
        me: true
      });
      this.leaderboard = this.leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    });
  }

  ngAfterViewInit() {
    document.querySelectorAll('audio').forEach((e) => {
      this.audios[e.id] = e;
    });
    if (this.internalState === State.WAITING || this.internalState === State.PAUSED ||
      this.internalState === State.GAME_OVER || this.internalState === State.PLAYING) {
      this.state = State.WAITING;
      this.start();
    } else if (this.internalState === State.LEADERBOARD) {
      this.getLeaderboard();
    } else if (this.state === State.TUTORIAL) {
      this.start();
    }
  }

  start() {
    this.audios['start'].play();
    this.gameService.start.bind(this)();
  }

  gameOver() {
    this.audios['end'].play();
    this.state = State.GAME_OVER;
    this.totalScore += this.score;
    this.donation.lives = 0;
    this.donation.amount = 0;
    setTimeout(() => {
      const scoreDown = new CountUp('xp', 0, {startVal: this.score});
      const lifeUp = new CountUp('xpLife', 0);
      const earnedLife = Math.max(2, Math.ceil(this.score / 500));
      this.donation.lives = earnedLife;
      scoreDown.start();
      lifeUp.update(earnedLife);
    }, 1000);
  }

  setTooltip() {
    setTimeout(() => {

      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
      })
    }, 500);
  }

  next() {
    const calls = [
      this.http
      .put(SurveyService.getUrl(this.machineCode + '/donation' + this.currentMatch), {
        donation: this.donation.amount,
        lives: this.donation.lives,
      })
    ];
    if (this.donation.amount > 0) {
      calls.push(
        this.http
        .put(SurveyService.getUrl('lastDonation'), {...this.donation, amount: Math.min(5, this.donation.amount)})
      );
    }
    combineLatest(calls).subscribe(() => {
        this.currentMatch++;
        if (this.currentMatch > 3) {
          this.state = State.POST;
        } else {
          this.life = new Array(this.donation.lives - this.donation.amount).fill(0);
          this.state = State.PAUSED;
          this.score = 0;
          this.start();
        }
      });
  }

  sendData( bin: string, sender: SurveyModel) {
    return this.http.put(SurveyService.getUrl(this.machineCode + '/' + bin), sender.getData());
  }
}


export class State {
  static GAME_OVER = 0;
  static PLAYING = 1;
  static PAUSED = 2;
  static WAITING = 3;
  static RECEIVING_DONATION = 4;
  static POST = 5;
  static PRE = 6;
  static LEADERBOARD = 7;
  static TUTORIAL = 8;
}


class Donation {
  amount: number;
  lives: number;
  name: string;
  message: string;
}
