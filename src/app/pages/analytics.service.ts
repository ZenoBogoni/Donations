/**
 * @file analytics.service.ts
 * @description Servizio per la generazione di grafici utilizzando ECharts.
 */

import { Injectable } from "@angular/core";
import { AnalyticsPage } from "./analytics.page";
declare var echarts;

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  /**
   * Genera un grafico a barre con ECharts evidenziando l'evoluzione delle donazioni.
   * Utilizza i dati compressi per visualizzazione.
   *
   * @param this Riferimento alla pagina di analisi.
   * @param type Tipo di categoria da visualizzare nel grafico. Default è "donations".
   */
  generateEChart(this: AnalyticsPage, type = "donations") {
    if (!this.originalData) {
      return;
    }

    this.selectedCategory = type;

    const anonimo = this.originalData
      .filter((e) => e.pre?.experiment_group === "anonimo")
      .map((e) => (e.donation1?.donation / e.donation1.lives + e.donation2?.donation / e.donation2.lives) / 2)
      .filter((e) => e);
    const nominativo = this.originalData
      .filter((e) => e.pre?.experiment_group === "non_anonimo")
      .map((e) => (e.donation1?.donation / e.donation1.lives + e.donation2?.donation / e.donation2.lives) / 2)
      .filter((e) => e);

    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const meanA = mean(anonimo);
    const meanN = mean(nominativo);

/*     for (let i = 0; i < 50; i++) {
      anonimo.push(meanA + (Math.random() - 0.5) * 5);
      nominativo.push(meanN + (Math.random() - 0.5) * 5);
    } */

    const maxXAxis = Math.ceil(
      Math.max(Math.max(...anonimo), Math.max(...nominativo)) + 5
    );

    const histoA = this.histogram(anonimo, 1);
    const histoN = this.histogram(nominativo, 1);

    const formatter = (arr) => (params) => {
      if (!params.value[1]) {
        return "";
      }
      return (
        // tslint:disable-next-line:radix
        ((parseInt(params.value[1]) / arr.length) * 100).toFixed(0) + "%"
      );
    };

    const option = {
      legend: {
        textStyle: {
          color: "white",
        },
        selectedMode: true,
      },
      toolbox: {
        show: true,
        feature: {
          magicType: { type: ["line", "bar"] },
          saveAsImage: {},
        },
      },
      xAxis: [
        {
          max: maxXAxis,
          type: "value",
          splitLine: {
            lineStyle: {
              color: "#333",
            },
          },
        },
        {
          max: maxXAxis,

          gridIndex: 1,
          type: "value",
          splitLine: {
            lineStyle: {
              color: "#333",
            },
          },
        },
      ],
      grid: [
        {
          left: 60,
          right: 50,
          height: "40%",
        },
        {
          left: 60,
          right: 50,
          top: "50%",
          height: "40%",
        },
      ],
      yAxis: [
        {
          gridIndex: 0,

          type: "value",
          splitLine: {
            lineStyle: {
              color: "#333",
            },
          },
          name: "Frequency histogram",
        },
        {
          gridIndex: 1,
          type: "value",
          splitLine: {
            lineStyle: {
              color: "#333",
            },
          },
          inverse: true,
        },
      ],
      series: [
        {
          name: "Anonymous",
          type: "bar",
          markLine: {
            data: [
              [
                { name: meanA.toFixed(2), xAxis: meanA, yAxis: 0 },
                { xAxis: meanA, yAxis: 10 },
              ],
            ],
          },
          label: {
            show: true,
            backgroundColor: "#fca6",
            padding: 5,
            borderRadius: 5,
            color: "black",
            formatter: formatter(anonimo),
          },
          barWidth: "10",
          data: histoA,
        },
        {
          name: "Nominative",
          type: "bar",
          barWidth: "10",
          xAxisIndex: 1,
          yAxisIndex: 1,
          markLine: {
            data: [
              [
                { name: meanN.toFixed(2), xAxis: meanN, yAxis: 0 },
                { xAxis: meanN, yAxis: 10 },
              ],
            ],
          },
          label: {
            show: true,
            backgroundColor: "#ffa6",
            padding: 5,
            borderRadius: 5,
            color: "black",
            formatter: formatter(nominativo),
          },
          data: histoN,
        },
      ],
    };

    this.histoChart.setOption(option);
  }


}
