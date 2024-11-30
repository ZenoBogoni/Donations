/**
 * @fileoverview Componente Angular per la gestione della pagina del sondaggio.
 * @module SurveyPage
 */

import { AfterViewInit, Component } from "@angular/core";
import _ from "lodash";
import { json } from "../data/survey2";
import { HttpClient } from "@angular/common/http";
import { Model } from "survey-core";
import { SurveyService } from "./survey.service";
declare var echarts: any;
declare var MultiRange: any;
declare var SurveyTheme: any;

@Component({
  selector: "survey-page",
  templateUrl: "./survey.page.html",
  styleUrls: ["./survey.page.scss"],
})
export class SurveyPage implements AfterViewInit {
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
  constructor(
    private http: HttpClient,
    protected surveyService: SurveyService
  ) {
    this.json = json;
    this.model = new Model(this.json);
    this.model.applyTheme(SurveyTheme.ContrastDark);
    this.model.cookieName = this.machineCode;
    this.model.showPrevButton = false;

    // Salva la pagina corrente nel localStorage quando cambia.
    this.model.onCurrentPageChanged.add(this.onPageChanged.bind(this));

    // Effettua una richiesta HTTP per ottenere i dati.
    this.http.get(SurveyService.getUrl("")).subscribe((data: any) => {
      this.data = [];
      data = data || {};

      // Riavvia il sondaggio dal punto in cui è stato interrotto.
      this.restartWhereLeft(data);

      // Unisce e linearizza i dati ricevuti dal server.
      Object.values(data).forEach((e) => this.data.push(...Object.values(e)));
      this.compressedData = this.surveyService.getCompressedData(this.data);

      // Deprecato: Genera un grafico a linea con ECharts.
      /* if (this.group === 1) {
        // Genera un grafico a linea con ECharts.
        this.generateEChart();
      } */

      // Salva i progressi nel localStorage quando i valori cambiano.
      this.model.onValueChanged.add(this.onAnswerChanged.bind(this));

      // Invia i dati completati al server quando il sondaggio è completato.
      this.model.onComplete.add(this.onCompleted.bind(this));
    });

    // Genera un nuovo codice macchina se non esiste.
    if (!this.machineCode) {
      this.machineCode = SurveyService.generateMachineCode();
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
    this.http
      .post(SurveyService.getUrl(this.machineCode), payload)
      .subscribe(() => {});
      if (this.group === 1) {
        this.step = 2;
      }
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
  restartWhereLeft(data: any = {}) {
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
   * @deprecated
   */
  generateEChart() {
    // Genera un grafico a linea con ECharts evidenziando l'evoluzione delle donazioni.
    // Utilizza i dati compressi per visualizzazione.
    if (!this.compressedData) {
      return;
    }

    const chartDom = document.getElementById("chart") as HTMLElement;
    const myChart = echarts.init(chartDom);
    myChart.setOption({
      textStyle: {
        color: "white",
      },
      color: ["orange"],
    });
    const option = {
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: this.compressedData
          .sort((a, b) => (b.time < a.time ? 1 : -1))
          .map((item) => item.time),
        axisLabel: {
          formatter: function (value, idx) {
            const date = new Date(value);
            return date.toLocaleString("it-IT");
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: function (value, idx) {
            return value + " €";
          },
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          data: this.compressedData
            .sort((a, b) => (b.time < a.time ? 1 : -1))
            .map((item) => item.donation_amount),
          type: "line",
          markLine: {
            data: [{ type: "average", name: "Avg" }],
          },
        },
      ],
    };

    myChart.setOption(option);
  }

  ngAfterViewInit() {
    /**
     * Inizializza il widget MultiRange.
     * Inoltre, ricrea i range se sono già stati inseriti.
     * Salva anche i valori dei range nel modello SurveyJS.
     */
    const loop = setInterval(() => {
      let node: any = document.evaluate(
        "//div[contains(@class, 'sd-element') and contains(., '{{multiRange}}')]",
        document.body,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (!node) {
        return;
      }
      node.innerHTML =
        `${node.innerHTML.replace("{{multiRange}}", '')}<div class="multiRange" style="width: 100%;"></div>`;
      node = node.querySelector(".multiRange");

      // salvo i valori di default nel caso qualcuno skippasse
      // TODO: è skippabile?
      this.model.setValue("budget_distribution", {
        housing: 12.5,
        food: 12.5,
        healthcare: 12.5,
        transportation: 12.5,
        entertainment: 12.5,
        savings: 12.5,
        donations: 12.5,
        other: 12.5,
      });

      const recreateRanges: any = Object.values(this.model.getValue("budget_distribution") || {});
      if (recreateRanges) {
        for (let i = 1; i < recreateRanges.length; i++) {
          recreateRanges[i] += recreateRanges[i - 1];
        }
      }

      const categories = ['Housing', 'Food', 'Healthcare', 'Transportation', 'Entertainment', 'Savings', 'Donations', 'Other'];

      const m = new MultiRange(node, {
        names: categories,
        ranges: recreateRanges?.length ? recreateRanges?.slice(1) : [12.5, 25, 37.5, 50, 62.5, 75, 87.5, 99.999],
        step: 0,
      });
      m.on("changed", (e) => {
        // rimappo i valori in un oggetto
        const ranges = _.cloneDeep(e.detail.ranges);
        const obj = {};
        for (let i = ranges.length - 1; i > 0; i--) {
          ranges[i] -= ranges[i - 1];
          ranges[i] = Math.round(ranges[i] * 1000) / 1000;
        }
        categories.forEach((category, i) => {
          obj[category.toLowerCase()] = ranges[i + 1];
        });

        // valorizzo il modello
        this.model.setValue("budget_distribution", obj);

        // salvo i progressi
        this.onAnswerChanged(this.model);
      });
      clearInterval(loop);
    }, 1000);

  }
}
