export const json = {
  "title": "Esperimento sul comportamento nelle donazioni",
  "description": "Studio sull'impatto del riconoscimento sociale sulle donazioni.",
  "logoPosition": "right",
  "completedHtml": "<h3>Grazie per aver partecipato all'esperimento!</h3>",
  "pages": [
    {
      "name": "intro",
      "elements": [
        {
          "type": "html",
          "name": "introduction",
          "html": "<p>In questo esperimento, esploreremo come diversi contesti influenzano il comportamento nelle donazioni. Rispondi con sincerità: non ci sono risposte giuste o sbagliate.</p>"
        }
      ]
    },
    {
      "name": "donation_anonymous",
      "visibleIf": "{experiment_group} = 'anonimo'",
      "elements": [
        {
          "type": "html",
          "name": "anonymous_info",
          "html": "<p>Sei nel gruppo anonimo. La tua donazione sarà completamente riservata e non sarà possibile associarla alla tua identità.</p>"
        },
        {
          "type": "text",
          "name": "donation_amount",
          "title": "Quanto desideri donare? (Importo in euro)",
          "inputType": "number",
          "isRequired": true,
          "validators": [
            { "type": "numeric", "minValue": 0, "maxValue": 1000 }
          ]
        }
      ]
    },
    {
      "name": "donation_non_anonymous",
      "visibleIf": "{experiment_group} = 'non_anonimo'",
      "elements": [
        {
          "type": "html",
          "name": "non_anonymous_info",
          "html": "<p>Sei nel gruppo non anonimo. La tua donazione sarà visibile agli altri partecipanti e associata al tuo nome.</p>"
        },
        {
          "type": "text",
          "name": "donation_amount",
          "title": "Quanto desideri donare? (Importo in euro)",
          "inputType": "number",
          "isRequired": true,
          "validators": [
            { "type": "numeric", "minValue": 0, "maxValue": 1000 }
          ]
        },
        {
          "type": "text",
          "name": "first_name",
          "title": "Inserisci il tuo nome",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "last_name",
          "title": "Inserisci il tuo cognome",
          "isRequired": true
        }
      ]
    },
    {
      "name": "propensity_questions",
      "elements": [
        {
          "type": "matrix",
          "name": "donation_motivation",
          "title": "Indica quanto sei d'accordo con le seguenti affermazioni relative alla donazione.",
          "columns": [
            { "value": 1, "text": "Per niente d'accordo" },
            { "value": 2, "text": "Poco d'accordo" },
            { "value": 3, "text": "Neutrale" },
            { "value": 4, "text": "Abbastanza d'accordo" },
            { "value": 5, "text": "Totalmente d'accordo" }
          ],
          "rows": [
            { "value": "help_others", "text": "Donare mi permette di aiutare gli altri." },
            { "value": "social_recognition", "text": "Donare mi fa sentire apprezzato dagli altri." },
            { "value": "personal_principles", "text": "Donare è in linea con i miei principi personali." },
            { "value": "moral_duty", "text": "Mi sento moralmente obbligato a donare." }
          ]
        }
      ]
    },
    {
      "name": "social_stigma",
      "elements": [
        {
          "type": "matrix",
          "name": "social_pressure",
          "title": "Quanto ritieni che le seguenti situazioni influenzino la tua scelta di donare?",
          "columns": [
            { "value": 1, "text": "Per niente" },
            { "value": 2, "text": "Poco" },
            { "value": 3, "text": "Moderatamente" },
            { "value": 4, "text": "Molto" },
            { "value": 5, "text": "Completamente" }
          ],
          "rows": [
            { "value": "being_watched", "text": "Essere osservato da altri mentre decido." },
            { "value": "public_announcement", "text": "Sapere che la mia donazione sarà resa pubblica." },
            { "value": "group_expectations", "text": "Le aspettative del gruppo di cui faccio parte." },
            { "value": "fear_of_judgment", "text": "La paura di essere giudicato se non dono." }
          ]
        }
      ]
    },
    {
      "name": "demographics",
      "elements": [
        {
          "type": "dropdown",
          "name": "age_group",
          "title": "Seleziona la tua fascia d'età",
          "isRequired": true,
          "choices": [
            { "value": "18_25", "text": "18-25" },
            { "value": "26_35", "text": "26-35" },
            { "value": "36_45", "text": "36-45" },
            { "value": "46_60", "text": "46-60" },
            { "value": "60_plus", "text": "Oltre 60" }
          ]
        },
        {
          "type": "dropdown",
          "name": "education",
          "title": "Qual è il tuo livello di istruzione?",
          "isRequired": true,
          "choices": [
            { "value": "no_degree", "text": "Nessun titolo di studio" },
            { "value": "high_school", "text": "Diploma di scuola superiore" },
            { "value": "bachelor", "text": "Laurea triennale" },
            { "value": "master", "text": "Laurea magistrale" },
            { "value": "doctorate", "text": "Dottorato" }
          ]
        },
        {
          "type": "radiogroup",
          "name": "income_level",
          "title": "Qual è il tuo livello di reddito mensile netto?",
          "isRequired": true,
          "choices": [
            { "value": "low", "text": "Meno di 1000€" },
            { "value": "medium", "text": "Tra 1000€ e 3000€" },
            { "value": "high", "text": "Oltre 3000€" }
          ]
        }
      ]
    },
    {
      "name": "feedback",
      "elements": [
        {
          "type": "comment",
          "name": "participant_feedback",
          "title": "Hai qualche commento o riflessione da condividere?"
        }
      ]
    }
  ],
  "showProgressBar": "top",
  "progressBarType": "questions",
  "goNextPageAutomatic": false,
  "showQuestionNumbers": "on",
  "questionTitleLocation": "top",
  "sendResultOnPageNext": true
};
