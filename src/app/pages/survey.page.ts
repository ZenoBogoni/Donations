import { Component } from "@angular/core";
import _ from "lodash";
import { json } from "../data/survey2";
import { HttpClient } from "@angular/common/http";
import { Model, SurveyModel } from "survey-core";

@Component({
  selector: "survey-page",
  templateUrl: "./survey.page.html",
  styles: [
    'td { padding: 0.5rem; text-align: center; }',
  ]
})
export class SurveyPage {
  json;
  data;
  machineCode = localStorage.getItem("machineCode");
  group;
  model;
  step = 1;
  compressedData: any[] | undefined;

  constructor(private http: HttpClient) {
    this.json = json;
    this.model = new Model(this.json);
    this.model.cookieName = this.machineCode;
    this.model.showPrevButton = false;

    this.model.onCurrentPageChanged.add((sender, options) => {
      localStorage.setItem("currentPage", JSON.stringify(sender.currentPageNo));
    });
    this.http
      .get(
        this.getUrl('')
      )
      .subscribe((data: any) => {
        this.data = [];
        if (data[this.machineCode]) {
          this.step = 2;
          this.model.doComplete();
        } else if (localStorage.getItem("progress")) {
          this.model.mergeData(
            JSON.parse(localStorage.getItem("progress")) || {}
          );
          this.model.currentPageNo =
            JSON.parse(localStorage.getItem("currentPage")) || 0;
        }
        Object.values(data).forEach((e) => this.data.push(...Object.values(e)));
        this.compressedData = this.getCompressedData();

        this.model.onValueChanged.add((sender, options) => {
          localStorage.setItem("progress", JSON.stringify(sender.getData()));
          localStorage.setItem("currentPage", JSON.stringify(sender.currentPageNo));
        });

        this.model.onComplete.add((sender, options) => {
          const payload = sender.getData();
          payload.time = new Date().toISOString();
          this.http
          .post(
            this.getUrl(this.machineCode),
            payload
          )
          .subscribe(() => {});
        });
      });
    if (!this.machineCode) {
      this.machineCode = this.generateMachineCode();
      localStorage.setItem("machineCode", this.machineCode);
    }
    this.group = +this.machineCode[0];
    this.model.setValue("experiment_group", this.group === 0 ? "anonimo" : "non_anonimo");
  }

  generateMachineCode() {
    const append = Math.random() > 0.5 ? "1" : "0";
    return append + Math.random().toString(36).substring(2, 15);
  }

  getCompressedData() {
    if (!this.data) {
      return null;
    }
    const columns = ['donation_motivation', 'donation_amount', 'first_name', 'last_name', 'time'];
    const data = this.data.map((e) => {
      const obj = {};

      Object.keys(e).forEach((key) => {
        if (columns.includes(key)) {
          obj[key] = e[key];
        }
      });
      return obj;
    });
    return data.sort((a, b) => b.time - a.time);
  }

  getUrl(obj: string) {
    return `https://donationsexperiment-default-rtdb.europe-west1.firebasedatabase.app/${obj}.json`;
  }
}
