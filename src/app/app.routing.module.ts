import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { SurveyPage } from "./pages/survey.page";
import { AnalyticsPage } from "./pages/analytics.page";
import { AnalyticsTabulatorPage } from './pages/analytics.tabulator.page';
import { PdfExportPage } from "./pages/pdfexport.page";


const routes: Routes = [
  { path: "", component: SurveyPage },
  { path: "analytics", component: AnalyticsPage },
  { path: "analyticstabulator", component: AnalyticsTabulatorPage},
  { path: "pdfexport", component: PdfExportPage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
