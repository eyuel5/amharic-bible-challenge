import { triviaQuestionsOT } from "./triviaQuestions_OT"
import { triviaQuestionsNT } from "./triviaQuestions_NT"

export const triviaQuestions = [...triviaQuestionsOT, ...triviaQuestionsNT]

export const triviaQuestionsByTestament = {
  ot: triviaQuestionsOT,
  nt: triviaQuestionsNT,
}
