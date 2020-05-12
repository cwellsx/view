export const config = {
  serverless: true,
  loginfails: false,
  autologin: true,
  appname: "Prototype",
  mockdelay: 25,
  exerptlength: 200,
  strQuestions: "Questions", // could be "Discussions or "Questions"
  strTags: "Tags", // could be "Tags or "Topics" or even "Features"
  strNewQuestion: {
    title: "Ask a question", // could be "Start a discussion" or "New discussion"
    button: "Ask Question", // could be "Start a discussion" or "New discussion"
    noun: "question",
  },
  tagValidation: {
    minimum: true,
    maximum: true,
    canNewTag: false,
  },
  minLengths: {
    title: 15,
    body: 30,
  },
};
