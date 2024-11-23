import { Component } from "@angular/core";
import { json } from "../data/survey2";
import { HttpClient } from "@angular/common/http";
import { SurveyService } from "./survey.service";

@Component({
  selector: "analytics-page",
  templateUrl: "./analytics.page.html",
})
export class AnalyticsPage {
  data;
  json = json;

  constructor(private http: HttpClient, private surveyService: SurveyService) {
    this.http
      .get(SurveyService.getUrl(""))
      .subscribe((data: any) => {
        this.data = [];
        Object.values(data).forEach((e) => this.data.push(...Object.values(e)));

        // this.data = surveyService.getCompressedData(data);
      });
  }
}
