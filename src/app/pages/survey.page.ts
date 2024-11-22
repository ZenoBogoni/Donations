import { Component } from "@angular/core";

import { json } from "../data/survey";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "survey-page",
  templateUrl: "./survey.page.html",
})
export class SurveyPage {
  json;
  data;
  machineCode = localStorage.getItem("machineCode");
  group;
  step = 1;

  constructor(private http: HttpClient) {
    this.json = json;
    this.http.get("https://donationsexperiment-default-rtdb.europe-west1.firebasedatabase.app/.json").subscribe((data: any) => {
      this.data = [];
      if (data[this.machineCode]) {
        // completed survey
      }
      Object.values(data).forEach(e => this.data.push(...Object.values(e)));
    });
    if (!this.machineCode) {
      this.machineCode = this.generateMachineCode();
      localStorage.setItem("machineCode", this.machineCode);
    }
    this.group = +this.machineCode[0];
  }

  generateMachineCode() {
    const append = Math.random() > 0.5 ? "1" : "0";
    return append + Math.random().toString(36).substring(2, 15);
  }

  sendData(result) {
    console.log(result);
    this.http.post(
      `https://donationsexperiment-default-rtdb.europe-west1.firebasedatabase.app/${this.machineCode}.json`, result).subscribe(() => {
    });
  }
}
