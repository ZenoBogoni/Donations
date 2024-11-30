import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  /**
   * Costruisce l'URL per le richieste HTTP.
   * @param {string} obj - Oggetto da aggiungere all'URL.
   * @returns {string} URL costruito.
   */
  static getUrl(obj: string) {
    return `https://donationsexperiment-default-rtdb.europe-west1.firebasedatabase.app/${obj}.json`;
  }

   /**
   * Genera un codice macchina casuale.
   * @returns {string} Codice macchina generato.
   */
   static generateMachineCode() {
    const append = Math.random() > 0.5 ? "1" : "0";
    return append + Math.random().toString(36).substring(2, 15);
  }

   /**
   * Ottiene i dati compressi per la visualizzazione.
   * @param {any[]} baseData - Dati ricevuti dal server.
   * @returns {any[] | null} Dati compressi.
   */
   getCompressedData(baseData: any[]) {
    if (!baseData) {
      return null;
    }
    const columns = [
      "donation_motivation",
      "budget_distribution",
      "name",
      "surname",
      "time",
    ];
    const data = baseData.map((e) => {
      const obj: any = {};

      Object.keys(e).forEach((key) => {
        if (columns.includes(key)) {
          obj[key] = e[key];
        }
      });
      return obj;
    });
    return data.sort((a, b) => (b.time > a.time ? 1 : -1));
  }
}
