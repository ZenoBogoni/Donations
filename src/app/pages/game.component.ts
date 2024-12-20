/**
 * @fileoverview Componente di gioco per la gestione delle donazioni e del punteggio.
 *
 * @module GameComponent
 */
import { AfterViewInit, Component, OnInit } from "@angular/core";
import { CountUp } from "countup.js";
import { SurveyService } from "./survey.service";
import { HttpClient } from "@angular/common/http";
import { combineLatest } from "rxjs";
import { PostSurvey } from "../data/post.survey";
import { Model, SurveyModel } from "survey-core";
import { PreSurvey } from "../data/pre.survey";
import { GameService } from "./game.service";
declare var $, bootstrap: any;
declare var SurveyTheme: any;

/**
 * Componente di gioco per la gestione delle donazioni e del punteggio.
 *
 * @class
 * @implements {OnInit}
 * @implements {AfterViewInit}
 */
@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
})
export class GameComponent implements OnInit, AfterViewInit {
  /**
   * Numero di osservatori casuali.
   * @type {number}
   */
  observers = Math.round(Math.random() * 5);
  /**
   * Punteggio attuale.
   * @type {number}
   */
  score = 0;
  /**
   * Contatore del punteggio.
   * @type {CountUp}
   */
  scoreContainer: CountUp;
  /**
   * Numero totale di vite.
   * @type {number}
   */
  TOTAL_LIVES = 6;
  /**
   * Array delle vite.
   * @type {number[]}
   */
  life = new Array(this.TOTAL_LIVES).fill(0);
  /**
   * Stato interno del gioco.
   * @type {number}
   */
  internalState = +localStorage.getItem("state") || State.PRE;
  /**
   * Punteggio totale.
   * @type {number}
   */
  totalScore = 0;
  /**
   * Classifica dei giocatori.
   * @type {any[]}
   */
  leaderboard = [];
  /**
   * Oggetto contenente gli audio.
   * @type {Object}
   */
  audios = {};
  /**
   * Stato del gioco.
   * @type {typeof State}
   */
  status = State;
  /**
   * Codice macchina.
   * @type {string | null}
   */
  machineCode = localStorage.getItem("machineCode");
  /**
   * Donazione attuale.
   * @type {Donation}
   */
  donation: Donation = {
    amount: 0,
    lives: 10,
    name: "",
    message: "",
  };
  /**
   * Donazione in arrivo.
   * @type {Donation}
   */
  incomingDonation: Donation = {
    amount: 2,
    lives: 0,
    name: "Deleter",
    message: "Good luck!",
  };
  /**
   * Partita corrente.
   * @type {number}
   */
  currentMatch = 1;
  /**
   * Modello del sondaggio post-partita.
   * @type {SurveyModel}
   */
  postSurvey: SurveyModel;
  /**
   * Modello del sondaggio pre-partita.
   * @type {SurveyModel}
   */
  preSurvey: SurveyModel;
  /**
   * Numero totale di partite.
   * @type {number}
   */
  TOTAL_MATCHES = 2;

  /**
   * Getter per lo stato del gioco.
   * @returns {number}
   */
  get state() {
    return this.internalState;
  }

  /**
   * Setter per lo stato del gioco.
   * @param {number} v - Nuovo stato del gioco.
   */
  set state(v) {
    this.internalState = v;
    localStorage.setItem("state", v.toString());
  }

  /**
   * Getter per l'array delle donazioni.
   * @returns {number[]}
   */
  get donationArray() {
    return new Array(Math.max(0, this.donation.lives - 1)).fill(0);
  }

  constructor(public http: HttpClient, private gameService: GameService, private surveyService: SurveyService) {}

  /**
   * Metodo di inizializzazione del componente.
   * @returns {void}
   */
  ngOnInit(): void {
    if (!this.machineCode || location.href.includes("force")) {
      this.machineCode = SurveyService.generateMachineCode();
      localStorage.setItem("machineCode", this.machineCode);
      this.state = State.PRE;
    }

    this.preSurvey = new Model(PreSurvey);
    // Ottiene il dispositivo e il browser dell'utente.
    const device = this.surveyService.getDeviceAndBrowser();
    this.preSurvey.setValue('experiment_group', this.machineCode[0] === '0' ? 'anonimo' : 'non_anonimo');
    this.preSurvey.setValue('device', device.device);
    this.preSurvey.setValue('browser', device.browser);
    this.preSurvey.setValue('start_time', new Date().toISOString());

    // Ottiene il paese dell'utente.
    try {
      this.surveyService.getCountry().then((country) => {
        this.preSurvey.setValue('country', country.country);
        this.preSurvey.setValue('city', country.city);
        this.preSurvey.setValue('region', country.region);
      }).catch(() => {
        this.preSurvey.setValue('country', 'unknown');
      });
    } catch (e) {
      this.preSurvey.setValue('country', 'unknown');
    }
    this.preSurvey.showPrevButton = false;
    this.preSurvey.applyTheme(SurveyTheme.ContrastDark);
    this.preSurvey.cookieName = this.machineCode;
    this.preSurvey.onComplete.add(() => {
      this.state = State.TUTORIAL;
      this.sendData("pre", this.preSurvey).subscribe(() => {
        this.start();
      });
    });
    this.postSurvey = new Model(PostSurvey);
    this.postSurvey.applyTheme(SurveyTheme.ContrastDark);
    this.postSurvey.showPrevButton = false;
    this.postSurvey.cookieName = this.machineCode;
    this.postSurvey.onComplete.add(() => {
      this.getLeaderboard();
      this.sendData("post", this.postSurvey).subscribe(() => {});
      this.http
        .put(
          SurveyService.getUrl(this.machineCode + "/totalScore"),
          this.totalScore
        )
        .subscribe(() => {});
      this.state = State.LEADERBOARD;
    });

    this.http
      .get(SurveyService.getUrl(`lastDonation${this.machineCode[0]}`))
      .subscribe((donation: Donation) => {
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

  /**
   * Metodo per ottenere la classifica.
   * @returns {void}
   */
  getLeaderboard() {
    this.http.get(SurveyService.getUrl("")).subscribe((data: any) => {
      this.leaderboard = [];
      for (const key in data) {
        if (!data[key].totalScore) {
          continue;
        }
        if (key[0] === this.machineCode[0]) {
          this.leaderboard.push(data[key]);
        }
      }
      this.leaderboard.push({
        totalScore: this.totalScore,
        name: "You",
        me: true,
      });
      this.leaderboard = this.leaderboard.sort(
        (a, b) => b.totalScore - a.totalScore
      );
    });
  }

  max(a, b) {
    return Math.max(a, b);
  }

  min(a, b) {
    return Math.min(a, b);
  }

  /**
   * Metodo chiamato dopo l'inizializzazione della vista.
   * @returns {void}
   */
  ngAfterViewInit() {
    document.querySelectorAll("audio").forEach((e) => {
      this.audios[e.id] = e;
    });
    if (
      this.internalState === State.WAITING ||
      this.internalState === State.PAUSED ||
      this.internalState === State.GAME_OVER ||
      this.internalState === State.PLAYING
    ) {
      this.state = State.WAITING;
      this.start();
    } else if (this.internalState === State.LEADERBOARD) {
      this.getLeaderboard();
    } else if (this.state === State.TUTORIAL) {
      this.start();
    }
  }

  /**
   * Metodo per avviare il gioco.
   * @returns {void}
   */
  start() {
    this.audios["start"].play();
    this.gameService.start.bind(this)();
  }

  /**
   * Metodo chiamato quando il gioco termina.
   * @returns {void}
   */
  gameOver() {
    this.audios["end"].play();
    this.state = State.GAME_OVER;
    this.totalScore += this.score;
    this.donation.lives = 0;
    this.donation.amount = 0;
    setTimeout(() => {
      const scoreDown = new CountUp("xp", 0, { startVal: this.score });
      const lifeUp = new CountUp("xpLife", 0);
      const earnedLife = Math.max(2, Math.ceil(this.score / 500));
      this.donation.lives = earnedLife;
      scoreDown.start();
      lifeUp.update(earnedLife);
    }, 1000);
  }

  /**
   * Metodo per impostare il tooltip.
   * @returns {void}
   */
  setTooltip() {
    setTimeout(() => {
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }, 500);
  }

  incrementAfterDonation() {
    this.donation.lives += +this.incomingDonation.amount || 0;
    this.state = State.PAUSED;
    this.life = new Array(this.donation.lives).fill(
      0
    );
  }

  /**
   * Metodo per passare alla partita successiva.
   * @returns {void}
   */
  next() {
    const calls = [
      this.http.put(
        SurveyService.getUrl(
          this.machineCode + "/donation" + this.currentMatch
        ),
        {
          ...this.donation
        }
      ),
    ];
    if (this.donation.amount > 0) {
      calls.push(
        this.http.put(
          SurveyService.getUrl(`lastDonation${this.machineCode[0]}`),
          { ...this.donation, amount: Math.min(5, this.donation.amount) }
        )
      );
    }
    combineLatest(calls).subscribe(() => {
      this.currentMatch++;
      if (this.currentMatch > this.TOTAL_MATCHES) {
        this.state = State.POST;
      } else {
        this.life = new Array(this.donation.lives - this.donation.amount).fill(
          0
        );
        this.donation.lives = this.life.length;
              this.state = State.RECEIVING_DONATION;
        this.setTooltip();
        this.score = 0;
        this.start();
      }
    });
  }

  /**
   * Metodo per inviare i dati del sondaggio.
   * @param {string} bin - Tipo di sondaggio (pre o post).
   * @param {SurveyModel} sender - Modello del sondaggio.
   * @returns {Observable<any>}
   */
  sendData(bin: string, sender: SurveyModel) {
    return this.http.put(
      SurveyService.getUrl(this.machineCode + "/" + bin),
      sender.getData()
    );
  }
}

/**
 * Classe che rappresenta gli stati del gioco.
 * @class
 */
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

/**
 * Classe che rappresenta una donazione.
 * @class
 */
class Donation {
  /**
   * Importo della donazione.
   * @type {number}
   */
  amount: number;

  /**
   * Numero di vite donate.
   * @type {number}
   */
  lives: number;

  /**
   * Nome del donatore.
   * @type {string}
   */
  name: string;

  /**
   * Messaggio del donatore.
   * @type {string}
   */
  message: string;
}
