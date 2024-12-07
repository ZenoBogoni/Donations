/**
 * @file analytics.service.ts
 * @description Servizio per la generazione di grafici utilizzando ECharts.
 */

import { Injectable } from "@angular/core";
import { AnalyticsPage } from "./analytics.page";
import * as X from "../data/survey2";
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
      .filter((e) => e.experiment_group === "anonimo")
      .map((e) => e.budget_distribution?.[type])
      .filter((e) => e);
    const nominativo = this.originalData
      .filter((e) => e.experiment_group === "non_anonimo")
      .map((e) => e.budget_distribution?.[type])
      .filter((e) => e);

    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const meanA = mean(anonimo);
    const meanN = mean(nominativo);

    for (let i = 0; i < 50; i++) {
      anonimo.push(meanA + (Math.random() - 0.5) * 5);
      nominativo.push(meanN + (Math.random() - 0.5) * 5);
    }

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
        (
          // tslint:disable-next-line:radix
          (parseInt(params.value[1]) / arr.length) *
          100
        ).toFixed(0) + "%"
      );
    };

    const option = {
      legend: {
        textStyle: {
          color: "white",
        },
        selectedMode: true,
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
            formatter: formatter(anonimo)
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
            formatter: formatter(nominativo)
          },
          data: histoN,
        },
      ],
    };

    this.histoChart.setOption(option);
  }

  /**
   * Calcola l'istogramma di un insieme di dati.
   * @param this Riferimento alla pagina di analisi.
   */
  generateEChart3D(this: AnalyticsPage) {
    const anonimo = this.originalData
      .map((e) => e.budget_distribution)
      .filter((e) => e);

    const histoA = [];

    this.categories.forEach((category) => {
      const anonimoData = anonimo.map((e) => e[category]);

      const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const meanA = mean(anonimoData);

      for (let i = 0; i < 50; i++) {
        anonimoData.push(meanA + (Math.random() - 0.5) * 5);
      }

      histoA.push(this.histogram(anonimoData, 1));
    });

    const max = Math.max(...histoA.map((e) => Math.max(...e.map((d) => d[1]))));

    const y = this.categories.map((e) => e.toUpperCase());
    const x = [];
    for (let i = 0; i < max + 1; i++) {
      x.push(i);
    }
    // prettier-ignore
    const option = {
      tooltip: {},
      axisLabel: {
        color: "white",
      },
      color: ["orange", "yellow"],
      xAxis3D: {
        type: "category",
        data: x,
      },
      yAxis3D: {
        type: "category",
        data: y,
      },
      zAxis3D: {
        type: "value",
      },
      grid3D: {
        boxWidth: 200,
        boxDepth: 50,
        viewControl: {
          projection: 'orthographic'
        },
        light: {
          main: {
            intensity: 0.6,
            shadow: true,
          },
          ambient: {
            intensity: 0.6,
          },
        },
      },
      series:
        this.categories.map((e, i) => {
          return {
            type: "bar3D",
            showBackground: true,
            data: histoA[i].map((d, j) => ({value: [d[0], i, d[1] || 0]})).filter(d => d.value[2] > 0),
            shading: "lambert",
            color: X.colors[i],
          };
        })

    };
    console.log(option);
    const chartDom = document.getElementById("chart2") as HTMLElement;
    const chart = echarts.init(chartDom);
    chart.setOption(option);
  }
}
