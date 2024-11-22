import { Component } from "@angular/core";

import { json } from "../data/survey";
import { data } from "../data/analytics";

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

  constructor() {
    this.json = json;
    this.data = data;
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
  }
}
