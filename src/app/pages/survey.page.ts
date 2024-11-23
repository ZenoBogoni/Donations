/**
 * @fileoverview Componente Angular per la gestione della pagina del sondaggio.
 * @module SurveyPage
 */

import { Component } from "@angular/core";
import _ from "lodash";
import { json } from "../data/survey2";
import { HttpClient } from "@angular/common/http";
import { Model } from "survey-core";

@Component({
  selector: "survey-page",
  templateUrl: "./survey.page.html",
  styles: ["td { padding: 0.5rem; text-align: center; }"],
})
export class SurveyPage {
  /**
   * JSON del sondaggio.
   * @type {any}
   */
  json: any;

  /**
   * Dati ricevuti dal server.
   * @type {any[]}
   */
  data: any[];

  /**
   * Codice macchina salvato nel localStorage.
   * @type {string | null}
   */
  machineCode = localStorage.getItem("machineCode");

  /**
   * Gruppo di esperimento determinato dal codice macchina.
   * @type {number}
   * @default 0 - Anonimo.
   */
  group = 0;

  /**
   * Modello del sondaggio.
   * @type {Model}
   */
  model: Model;

  /**
   * Passo corrente del sondaggio.
   * @type {number}
   * @default 1 - Lista di risultati
   */
  step = 1;

  /**
   * Dati compressi per visualizzazione.
   * @type {any[] | undefined}
   */
  compressedData: any[] | undefined;

  /**
   * Costruttore del componente.
   * @param {HttpClient} http - Servizio HttpClient per le richieste HTTP.
   */
  constructor(private http: HttpClient) {
    this.json = json;
    this.model = new Model(this.json);
    this.model.cookieName = this.machineCode;
    this.model.showPrevButton = false;

    // Salva la pagina corrente nel localStorage quando cambia.
    this.model.onCurrentPageChanged.add(this.onPageChanged.bind(this));

    // Effettua una richiesta HTTP per ottenere i dati.
    this.http.get(this.getUrl("")).subscribe((data: any) => {
      this.data = [];

      // Riavvia il sondaggio dal punto in cui è stato interrotto.
      this.restartWhereLeft(data);

      // Unisce e linearizza i dati ricevuti dal server.
      Object.values(data).forEach((e) => this.data.push(...Object.values(e)));
      this.compressedData = this.getCompressedData();

      // Salva i progressi nel localStorage quando i valori cambiano.
      this.model.onValueChanged.add(this.onAnswerChanged.bind(this));

      // Invia i dati completati al server quando il sondaggio è completato.
      this.model.onComplete.add(this.onCompleted.bind(this));
    });

    // Genera un nuovo codice macchina se non esiste.
    if (!this.machineCode) {
      this.machineCode = this.generateMachineCode();
      localStorage.setItem("machineCode", this.machineCode);
    }

    this.group = +this.machineCode[0];
    this.model.setValue(
      "experiment_group",
      this.group === 0 ? "anonimo" : "non_anonimo"
    );
  }

  /**
   * Invia i dati completati al server.
   * @param sender {Model} - Modello del sondaggio.
   */
  onCompleted(sender: Model) {
    const payload = sender.getData();
    payload.time = new Date().toISOString();
    this.http.post(this.getUrl(this.machineCode), payload).subscribe(() => {});
  }

  /**
   * Salva i progressi nel localStorage quando i valori cambiano.
   * @param sender {Model} - Modello del sondaggio.
   */
  onAnswerChanged(sender: Model) {
    localStorage.setItem("progress", JSON.stringify(sender.getData()));
    localStorage.setItem("currentPage", JSON.stringify(sender.currentPageNo));
  }

  /**
   * Salva la pagina corrente nel localStorage quando cambia.
   * @param sender {Model} - Modello del sondaggio.
   * @returns {void}
   * @throws {Error} Errore se il sender non è un Model.
   * @throws {Error} Errore se il sender non ha currentPageNo.
   */
  onPageChanged(sender: Model) {
    localStorage.setItem("currentPage", JSON.stringify(sender.currentPageNo));
  }

  /**
   * Riavvia il sondaggio dal punto in cui è stato interrotto.
   * @param data - Dati ricevuti dal server.
   */
  restartWhereLeft(data: any) {
    if (data[this.machineCode]) {
      this.step = 2;
      this.model.doComplete();
    } else if (localStorage.getItem("progress")) {
      this.model.mergeData(JSON.parse(localStorage.getItem("progress")) || {});
      this.model.currentPageNo =
        JSON.parse(localStorage.getItem("currentPage")) || 0;
      this.step = 2;
    }
  }

  /**
   * Genera un codice macchina casuale.
   * @returns {string} Codice macchina generato.
   */
  generateMachineCode() {
    const append = Math.random() > 0.5 ? "1" : "0";
    return append + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Ottiene i dati compressi per la visualizzazione.
   * @returns {any[] | null} Dati compressi.
   */
  getCompressedData() {
    if (!this.data) {
      return null;
    }
    const columns = [
      "donation_motivation",
      "donation_amount",
      "first_name",
      "last_name",
      "time",
    ];
    const data = this.data.map((e) => {
      const obj: any = {};

      Object.keys(e).forEach((key) => {
        if (columns.includes(key)) {
          obj[key] = e[key];
        }
      });
      return obj;
    });
    return data.sort((a, b) => (b.time > a.time ? 1 : -1));
  }

  /**
   * Costruisce l'URL per le richieste HTTP.
   * @param {string} obj - Oggetto da aggiungere all'URL.
   * @returns {string} URL costruito.
   */
  getUrl(obj: string) {
    return `https://donationsexperiment-default-rtdb.europe-west1.firebasedatabase.app/${obj}.json`;
  }
}
