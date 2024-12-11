export const PreSurvey = {
  title: "Experiment on Financial Behavior",
  description: "A study on financial decision-making.",
  logoPosition: "right",
  completedHtml: "<h3>Now start playing!</h3>",
  pages: [
    {
      name: "intro",
      elements: [
        {
          type: "html",
          name: "introduction",
          html: `<p><h3>Introduction to this survey</h3>

Thank you for your interest in participating in this study. This survey is part of an academic research project aimed at understanding financial allocation mechanisms and their impact on individual economic decision-making. Your participation is essential to the success of this research and will contribute to a deeper understanding of financial behavior in a social context.

<h6>Privacy and data sharing</h6>
Some of the information collected during this questionnaire <b>may be shared publicly</b> in aggregated, anonymous or personally identifiable form for research purposes. The results will be used solely for academic purposes and published in compliance with deontological ethics.

<h6>Importance of your contribution</h6>
Your input represents a valuable contribution to this study, helping us gather meaningful data that reflects diverse individual perspectives. Providing accurate and honest responses is crucial to ensuring the quality and reliability of the analyses derived from this research.

<h6>Time commitment and details</h6>
The survey will take approximately 5-10 minutes to complete. There are no right or wrong answers; we kindly ask you to respond based on your personal experiences and opinions.

We sincerely thank you for your time and valuable contribution. Should you have any questions or require further information, please do not hesitate to contact us.</p>`,
        },
        {
          type: "checkbox",
          name: "tos",
          choices: [
            {
              value: "confirmed",
              text: "I confirm that I have read and understood the information provided above.",
            },
          ],
          title:
            "Please confirm that you have read and understood the information provided above.",
          isRequired: true,
        },
      ],
    },
    {
      name: "demographics",
      elements: [

        {
          type: "dropdown",
          name: "age_group",
          analytics: true,
          title: "Select your age group:",
          isRequired: false,
          choices: [
            { value: "18_25", text: "18-25" },
            { value: "26_35", text: "26-35" },
            { value: "36_45", text: "36-45" },
            { value: "46_60", text: "46-60" },
            { value: "60_plus", text: "Over 60" },
          ],
        },
        {
          type: "radiogroup",
          name: "gender",
          analytics: true,

          title: "What is your gender?",
          isRequired: false,
          choices: [
            { value: "male", text: "Male" },
            { value: "female", text: "Female" },
            { value: "prefer_not_to_say", text: "Prefer not to say" },
          ],
        },
        {
          type: "dropdown",
          name: "education",
          analytics: true,
          title: "What is your highest level of education?",
          isRequired: false,
          choices: [
            { value: "no_degree", text: "No degree" },
            { value: "high_school", text: "High School Diploma" },
            { value: "bachelor", text: "Bachelor's Degree" },
            { value: "master", text: "Master's Degree" },
            { value: "doctorate", text: "Doctorate" },
          ],
        },
        {
          type: "dropdown",
          name: "employment_status",
          analytics: true,

          title: "What is your current employment status?",
          isRequired: false,
          choices: [
            { value: "unemployed", text: "Unemployed" },
            { value: "student", text: "Student" },
            { value: "employed", text: "Employed" },
            { value: "retired", text: "Retired" },
          ],
        },
      ],
    },
  ],
  showProgressBar: "top",
  progressBarType: "questions",
  goNextPageAutomatic: false,
  showQuestionNumbers: "on",
  questionTitleLocation: "top",
  sendResultOnPageNext: true,
};
