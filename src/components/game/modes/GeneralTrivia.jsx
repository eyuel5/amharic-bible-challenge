import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getAllBooks } from "../../../services/bibleService"
import { triviaQuestions } from "../../../data/questions/triviaQuestions"

const allBooks = getAllBooks()
const bookById = new Map(allBooks.map((book) => [book.id, book]))

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function buildOptions(question) {
  const choices = Array.isArray(question.choices) ? question.choices : []
  const answerIndex = Number.isInteger(question.answerIndex) ? question.answerIndex : -1
  const correctChoice = choices[answerIndex]
  const targetCount = 4

  let pickedChoices = choices
  if (choices.length > targetCount && correctChoice !== undefined) {
    const others = choices.filter((_, index) => index !== answerIndex)
    const shuffledOthers = shuffle(others)
    pickedChoices = [correctChoice, ...shuffledOthers.slice(0, targetCount - 1)]
  }

  const tagged = pickedChoices.map((choice, index) => ({
    label: choice,
    isCorrect: choice === correctChoice,
    originalIndex: index,
  }))
  const shuffled = shuffle(tagged)
  const correct = shuffled.find((option) => option.isCorrect)
  return {
    options: shuffled,
    correctLabel: correct?.label ?? "",
  }
}

export default function GeneralTriviaGame({
  questionCount,
  sourceScope,
  sourceBookId,
  onComplete,
  labels,
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [answerResult, setAnswerResult] = useState(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const lastQuestionIdRef = useRef("")
  const usedQuestionIdsRef = useRef(new Set())

  const filteredQuestions = useMemo(() => {
    if (!Array.isArray(triviaQuestions)) return []

    if (sourceScope === "single") {
      return triviaQuestions.filter((item) => item.sourceBook === sourceBookId)
    }

    if (sourceScope === "ot" || sourceScope === "nt") {
      return triviaQuestions.filter((item) => {
        const book = bookById.get(item.sourceBook)
        return book?.testament === sourceScope
      })
    }

    return triviaQuestions
  }, [sourceBookId, sourceScope])

  const createTriviaQuestion = useCallback(() => {
    if (filteredQuestions.length === 0) {
      throw new Error("No trivia questions found for the selected source.")
    }

    let available = filteredQuestions.filter(
      (question) => !usedQuestionIdsRef.current.has(question.id),
    )

    if (available.length === 0) {
      usedQuestionIdsRef.current.clear()
      available = filteredQuestions
    }

    const maxAttempts = 6
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = pickRandom(available)
      if (candidate.id !== lastQuestionIdRef.current) {
        usedQuestionIdsRef.current.add(candidate.id)
        return { ...candidate, ...buildOptions(candidate) }
      }
    }

    const fallback = pickRandom(available)
    usedQuestionIdsRef.current.add(fallback.id)
    return { ...fallback, ...buildOptions(fallback) }
  }, [filteredQuestions])

  const startNextRound = useCallback(() => {
    setLoading(true)
    setError("")
    setSelectedIndex(null)
    setAnswerResult(null)

    try {
      const question = createTriviaQuestion()
      setCurrentQuestion(question)
      lastQuestionIdRef.current = question.id ?? ""
    } catch (nextError) {
      setCurrentQuestion(null)
      setError(nextError.message || "Failed to prepare the next question.")
    } finally {
      setLoading(false)
    }
  }, [createTriviaQuestion])

  function submitAnswer(index) {
    if (!currentQuestion || answerResult) return

    const selected = currentQuestion.options[index]
    const correct = Boolean(selected?.isCorrect)
    setSelectedIndex(index)
    setAnswerResult(correct ? "correct" : "wrong")
    setRound((value) => value + 1)

    if (correct) {
      setScore((value) => value + 1)
    } else {
      setMistakes((items) => [
        ...items,
        {
          id: currentQuestion.id,
          prompt: currentQuestion.question,
          correctAnswer: currentQuestion.correctLabel,
          yourAnswer: selected?.label ?? "",
        },
      ])
    }
  }

  function finishSession() {
    const accuracy = round === 0 ? 0 : Math.round((score / round) * 100)
    onComplete({ score, round, accuracy, mistakes })
  }

  useEffect(() => {
    startNextRound()
  }, [startNextRound])

  useEffect(() => {
    usedQuestionIdsRef.current.clear()
    lastQuestionIdRef.current = ""
  }, [filteredQuestions])

  const sourceBookName = useMemo(() => {
    if (!currentQuestion?.sourceBook) return ""
    return bookById.get(currentQuestion.sourceBook)?.nameAm ?? ""
  }, [currentQuestion?.sourceBook])

  const referenceText = useMemo(() => {
    const reference = currentQuestion?.reference
    if (!reference) return ""
    const bookName = sourceBookName
    const chapter = reference.chapter
    const verseStart = reference.verseStart
    const verseEnd = reference.verseEnd

    if (!chapter) return ""
    const verseRange = verseStart
      ? verseEnd && verseEnd !== verseStart
        ? `${chapter}:${verseStart}–${verseEnd}`
        : `${chapter}:${verseStart}`
      : `${chapter}`

    return bookName ? `${bookName} ${verseRange}` : verseRange
  }, [currentQuestion?.reference, sourceBookName])

  return (
    <>
      <div className="surface mt-6 p-4 text-sm">
        <div className="flex items-center gap-2 text-[var(--text)]" aria-label="Progress">
          <span className="font-semibold text-[var(--text-soft)]">{labels.questionShort}</span>
          <span className="font-semibold">
            {Math.min(round + (answerResult ? 0 : 1), questionCount)} / {questionCount}
          </span>
        </div>
      </div>

      <div className="surface-soft mt-6 p-5">
        {loading && <p className="text-[var(--text-soft)]">{labels.preparingQuestion}</p>}
        {!loading && error && <p className="text-[var(--danger)]">{error}</p>}

        {!loading && !error && currentQuestion && (
          <>
            <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">
              {labels.chooseAnswerPrompt ?? "Choose the correct answer"}
            </p>
            <p className="mt-3 rounded-lg border border-[var(--stroke)] bg-[var(--panel)] p-4 text-base leading-7 text-[var(--text)]">
              {currentQuestion.question}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedIndex === index
                const isCorrectAnswer = answerResult && option.isCorrect
                const isWrongSelected = answerResult === "wrong" && isSelected

                return (
                  <button
                    key={`${option.label}-${index}`}
                    type="button"
                    onClick={() => submitAnswer(index)}
                    disabled={Boolean(answerResult)}
                    className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                      isCorrectAnswer
                        ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_22%,var(--panel))] text-[var(--text)]"
                        : isWrongSelected
                          ? "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_22%,var(--panel))] text-[var(--text)]"
                          : "border-[var(--stroke)] bg-[var(--panel)] text-[var(--text)] hover:border-[var(--accent)]"
                    } disabled:cursor-not-allowed`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            {answerResult && (
              <div className="mt-5 rounded-lg border border-[var(--stroke)] bg-[var(--panel)] p-4 text-sm">
                <p className={answerResult === "correct" ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {answerResult === "correct" ? labels.correct : labels.notCorrect}
                </p>
                <p className="mt-2 text-[var(--text-soft)]">
                  {labels.answerLabel}: {currentQuestion.correctLabel}
                </p>
                {(sourceBookName || referenceText) && (
                  <p className="mt-1 text-[var(--text-soft)]">
                    {labels.sourceLabel}: {referenceText || sourceBookName}
                  </p>
                )}
                {currentQuestion.explanation && (
                  <p className="mt-2 text-[var(--text-soft)]">{currentQuestion.explanation}</p>
                )}
                {round >= questionCount ? (
                  <button
                    type="button"
                    onClick={finishSession}
                    className="primary-btn mt-4 px-4 py-2 text-sm"
                  >
                    {labels.seeResults}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startNextRound}
                    className="primary-btn mt-4 px-4 py-2 text-sm"
                  >
                    {labels.nextQuestion}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
