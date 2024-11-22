import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { SurveyPage } from "./pages/survey.page";
import { AnalyticsPage } from "./pages/analytics.page";
import { AnalyticsTabulatorPage } from './pages/analytics.tabulator.page';
import { AnalyticsDatatablesPage } from './pages/analytics.datatables.page';
import { PdfExportPage } from "./pages/pdfexport.page";


const routes: Routes = [
  { path: "", component: SurveyPage },
  { path: "analytics", component: AnalyticsPage },
  { path: "analyticsdatatables", component: AnalyticsDatatablesPage},
  { path: "analyticstabulator", component: AnalyticsTabulatorPage},
  { path: "pdfexport", component: PdfExportPage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
