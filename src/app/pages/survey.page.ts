/**
 * @fileoverview Componente Angular per la gestione della pagina del sondaggio.
 * @module SurveyPage
 */

import { AfterViewInit, Component } from "@angular/core";
import _ from "lodash";
import { categories, colors, json } from "../data/survey2";
import { HttpClient } from "@angular/common/http";
import { Model } from "survey-core";
import { SurveyService } from "./survey.service";
import { ActivatedRoute } from "@angular/router";
declare var echarts: any;
declare var MultiRange: any;
declare var DraggablePiechart: any;
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
    protected surveyService: SurveyService,
    private activated: ActivatedRoute
  ) {
    this.json = json;
    this.model = new Model(this.json);
    this.model.applyTheme(SurveyTheme.ContrastDark);
    this.model.cookieName = this.machineCode;
    this.model.showPrevButton = false;

    this.activated.queryParams.subscribe((params) => {
      if (params["force"]) {
        localStorage.removeItem("progress");
        localStorage.removeItem("currentPage");
        localStorage.removeItem("machineCode");
      }
      this.model.setValue('referal', params['referal'] || 'unknown');
      this.initialize();
    });



  }

  initialize() {
    // Salva la pagina corrente nel localStorage quando cambia.
    this.model.onCurrentPageChanged.add(this.onPageChanged.bind(this));

    // Effettua una richiesta HTTP per ottenere i dati.
    this.http.get(SurveyService.getUrl("")).subscribe((data: any) => {
      this.data = [];
      data = data || {};

      // Riavvia il sondaggio dal punto in cui è stato interrotto.
      this.restartWhereLeft(data);

      // Unisce e linearizza i dati ricevuti dal server.
      Object.values(data).forEach((e) => this.data.push(e));
      this.compressedData = this.surveyService.getCompressedData(this.data);

      // Salva i progressi nel localStorage quando i valori cambiano.
      this.model.onValueChanged.add(this.onAnswerChanged.bind(this));

      // Invia i dati completati al server quando il sondaggio è completato.
      this.model.onComplete.add(this.onCompleted.bind(this));

      // Ottiene il dispositivo e il browser dell'utente.
      this.model.setValue('device', this.surveyService.getDeviceAndBrowser());

      // Ottiene il paese dell'utente.
      try {
        this.surveyService.getCountry().then((country) => {
          this.model.setValue('country', country);
        }).catch(() => {
          this.model.setValue('country', 'unknown');
        });
      } catch (e) {
        this.model.setValue('country', 'unknown');
      }
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
      .put(SurveyService.getUrl(this.machineCode), payload)
      .subscribe(() => {});
    if (this.group === 1) {
      this.data.push(payload);
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
    if (sender.currentPageNo > 0) {
      this.http
        .put(SurveyService.getUrl(this.machineCode + '/lastPage'), sender.currentPageNo)
        .subscribe(() => {});
    }
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
    if (data[this.machineCode]?.tos) {
      this.step = 2;
      this.model.doComplete();
    } else if (localStorage.getItem("progress")) {
      this.model.mergeData(JSON.parse(localStorage.getItem("progress")) || {});
      this.model.currentPageNo =
        JSON.parse(localStorage.getItem("currentPage")) || 0;
    }
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

      node.innerHTML = `${node.innerHTML.replace(
        "{{multiRange}}",
        ""
      )}<div class="container-range"><div class="multiRange" style="width: 100%;"></div>
        <h3>Or you can use the following sliders:</h3>
        <canvas id="piechart" width="300" height="300">
          Your browser is too old!
        </canvas>
            <div id="proportions-table"></div></div>
        `;
      const data = categories.map((category, i) => ({
        proportion: 0.125,
        label: category.toLowerCase(),
        format: {
          color: colors[i],
          label: category,
        },
        collapsed: false,
      }));

      const onPieChartChange = (piechart) => {
        const table = document.getElementById("proportions-table");
        const percentages = piechart.getAllSliceSizePercentages();

        this.setValuesInModel(percentages);

        let propsRow = "<div class='row'>";
        for (let i = 0; i < data.length; i += 1) {

          const v = `<var>${percentages[i].toFixed(0)}%</var>`;
          const plus =
            `<div id="plu-${categories[i]}" class="adjust-button" data-i="${i}" data-d="-1">&#43;</div>`;
          const minus =
            `<div id="min-${categories[i]}" class="adjust-button" data-i="${i}" data-d="1">&#8722;</div>`;
          propsRow += `<div class="col-12 col-md-1 border-bottom border-dark"><b>${data[i].format.label}</b><br>${v}${plus}${minus}</div>`;
        }
        propsRow += "</div>";

        table.innerHTML = propsRow;

        const adjust = document.getElementsByClassName("adjust-button");

        function adjustClick(e) {
          const i = this.getAttribute("data-i");
          const d = this.getAttribute("data-d");

          piechart.moveAngle(i, d * 0.1);
        }

        for (let i = 0; i < adjust.length; i++) {
          adjust[i].addEventListener("click", adjustClick);
        }
      }

      const pie = new DraggablePiechart({
        canvas: document.getElementById("piechart"),
        radius: 0.9,
        collapsing: true,
        proportions: data,
        onchange: onPieChartChange,
      });




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
      /*
      node = node.querySelector(".multiRange");
      const recreateRanges: any = Object.values(
        this.model.getValue("budget_distribution") || {}
      );
      if (recreateRanges) {
        for (let i = 1; i < recreateRanges.length; i++) {
          recreateRanges[i] += recreateRanges[i - 1];
        }
      }

      const m = new MultiRange(node, {
        names: categories,
        ranges: recreateRanges?.length
          ? recreateRanges
          : [12.5, 25, 37.5, 50, 62.5, 75, 87.5, 99.999],
        step: 0,
      });
      m.on("changed", (e) => {
        // rimappo i valori in un oggetto
        const ranges = _.cloneDeep(e.detail.ranges);
        for (let i = ranges.length - 1; i > 0; i--) {
          ranges[i] -= ranges[i - 1];
          ranges[i] = Math.round(ranges[i] * 1000) / 1000;
        }

        // setto i valori nel modello
        this.setValuesInModel(ranges);
      }); */
      clearInterval(loop);
    }, 1000);
  }

  /**
   * Setta i valori nel modello.
   * @param categories - Categorie.
   * @param ranges - Range.
   */
  setValuesInModel(ranges: number[]) {
    const obj = {};
    categories.forEach((category, i) => {
      obj[category.toLowerCase()] = ranges[i];
    });

    // valorizzo il modello
    this.model.setValue("budget_distribution", obj);

    // salvo i progressi
    this.onAnswerChanged(this.model);
  }
}
