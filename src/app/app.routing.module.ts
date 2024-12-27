import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AnalyticsPage } from "./pages/analytics.page";
import { AnalyticsTabulatorPage } from './pages/analytics.tabulator.page';
import { GameComponent } from "./pages/game.component";


const routes: Routes = [
  { path: "analytics", component: AnalyticsPage },
  { path: "analyticstabulator", component: AnalyticsTabulatorPage},
  { path: "", component: GameComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
