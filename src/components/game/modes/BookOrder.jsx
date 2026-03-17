import { useCallback, useEffect, useMemo, useState } from "react"
import { getAllBooks } from "../../../services/bibleService"

const allBooks = getAllBooks()

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

function getOrderOptions(books, promptIndex, direction, optionCount = 4) {
  const answerIndex = direction === "before" ? promptIndex - 1 : promptIndex + 1
  const correct = books[answerIndex]
  const neighborCandidates =
    direction === "before"
      ? [books[promptIndex + 1], books[promptIndex - 2], books[promptIndex + 2], books[promptIndex - 3]]
      : [books[promptIndex - 1], books[promptIndex + 2], books[promptIndex - 2], books[promptIndex + 3]]

  const distractors = []
  const used = new Set([correct?.id])

  neighborCandidates.forEach((book) => {
    if (book && !used.has(book.id) && distractors.length < optionCount - 1) {
      distractors.push(book)
      used.add(book.id)
    }
  })

  if (distractors.length < optionCount - 1) {
    const randomFill = shuffle(books).filter((book) => !used.has(book.id)).slice(0, optionCount - 1 - distractors.length)
    randomFill.forEach((book) => distractors.push(book))
  }

  return shuffle([correct, ...distractors].filter(Boolean))
}

function buildOrderPrompt(direction, bookName, labels) {
  const prefix = direction === "after" ? labels.comesAfterPrefix : labels.comesBeforePrefix
  const suffix = direction === "after" ? labels.comesAfterSuffix : labels.comesBeforeSuffix
  const spacer = suffix.startsWith("?") ? "" : " "
  return `${prefix} ${bookName}${spacer}${suffix}`
}

export default function BookOrderGame({ questionCount, sourceScope, onComplete, labels }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswerId, setSelectedAnswerId] = useState("")
  const [answerResult, setAnswerResult] = useState(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])

  const sourceBooks = useMemo(() => {
    if (sourceScope === "ot") return allBooks.filter((book) => book.testament === "ot")
    if (sourceScope === "nt") return allBooks.filter((book) => book.testament === "nt")
    return allBooks
  }, [sourceScope])

  const createQuestion = useCallback(async () => {
    if (sourceBooks.length < 2) {
      throw new Error("Not enough books in this source to build order questions.")
    }

    const direction = pickRandom(["before", "after"])
    const promptIndex =
      direction === "before"
        ? 1 + Math.floor(Math.random() * (sourceBooks.length - 1))
        : Math.floor(Math.random() * (sourceBooks.length - 1))
    const promptBook = sourceBooks[promptIndex]
    const answerBook = sourceBooks[direction === "before" ? promptIndex - 1 : promptIndex + 1]
    const options = getOrderOptions(sourceBooks, promptIndex, direction)

    return {
      promptBook,
      answerBook,
      direction,
      options,
    }
  }, [sourceBooks])

  const startNextRound = useCallback(async () => {
    setLoading(true)
    setError("")
    setSelectedAnswerId("")
    setAnswerResult(null)

    try {
      const question = await createQuestion()
      setCurrentQuestion(question)
    } catch (nextError) {
      setCurrentQuestion(null)
      setError(nextError.message || "Failed to prepare the next question.")
    } finally {
      setLoading(false)
    }
  }, [createQuestion])

  function submitAnswer(bookId) {
    if (!currentQuestion || answerResult) return

    const correct = currentQuestion.answerBook.id === bookId
    setSelectedAnswerId(bookId)
    setAnswerResult(correct ? "correct" : "wrong")
    setRound((value) => value + 1)

    if (correct) {
      setScore((value) => value + 1)
    } else {
      const selectedBook = allBooks.find((book) => book.id === bookId)
      const prompt = buildOrderPrompt(currentQuestion.direction, currentQuestion.promptBook.nameAm, labels)
      setMistakes((items) => [
        ...items,
        {
          id: `${currentQuestion.promptBook.id}:${currentQuestion.direction}`,
          prompt,
          correctAnswer: currentQuestion.answerBook.nameAm,
          yourAnswer: selectedBook?.nameAm ?? "",
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
            <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">{labels.bookOrderTitle}</p>
            <p className="mt-3 text-base text-[var(--text)]">
              {currentQuestion.direction === "after" ? labels.comesAfterPrefix : labels.comesBeforePrefix}{" "}
              <span className="font-semibold">{currentQuestion.promptBook.nameAm}</span>
              {(() => {
                const suffix =
                  currentQuestion.direction === "after" ? labels.comesAfterSuffix : labels.comesBeforeSuffix
                const spacer = suffix.startsWith("?") ? "" : " "
                return `${spacer}${suffix}`
              })()}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswerId === option.id
                const isCorrectAnswer = answerResult && option.id === currentQuestion.answerBook.id
                const isWrongSelected = answerResult === "wrong" && isSelected

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => submitAnswer(option.id)}
                    disabled={Boolean(answerResult)}
                    className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                      isCorrectAnswer
                        ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_22%,var(--panel))] text-[var(--text)]"
                        : isWrongSelected
                          ? "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_22%,var(--panel))] text-[var(--text)]"
                          : "border-[var(--stroke)] bg-[var(--panel)] text-[var(--text)] hover:border-[var(--accent)]"
                    } disabled:cursor-not-allowed`}
                  >
                    {option.nameAm}
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
                  {labels.answerLabel}: {currentQuestion.answerBook.nameAm}
                </p>
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
