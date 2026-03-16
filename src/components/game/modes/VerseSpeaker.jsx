import { useCallback, useEffect, useMemo, useState } from "react"
import { collectSpeakerQuotes } from "../../../services/SpeakerExtraction"
import { BIBLE_FIGURES } from "../../../data/bible/bibleFigures"

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function pickQuestionOrder(pool, questionCount) {
  const remaining = shuffle(pool)
  const selections = []
  const usedBooks = new Set()

  while (remaining.length > 0 && selections.length < questionCount) {
    if (selections.length === 0) {
      const first = remaining.shift()
      selections.push(first)
      usedBooks.add(first.bookId)
      continue
    }

    const last = selections[selections.length - 1]
    const remainingBooks = new Set(remaining.map((item) => item.bookId))
    if (usedBooks.size >= remainingBooks.size) {
      usedBooks.clear()
    }

    let nextIndex = remaining.findIndex(
      (item) =>
        item.bookId !== last.bookId &&
        item.chapter !== last.chapter &&
        !usedBooks.has(item.bookId),
    )

    if (nextIndex === -1) {
      nextIndex = remaining.findIndex(
        (item) => item.bookId !== last.bookId && !usedBooks.has(item.bookId),
      )
    }

    if (nextIndex === -1) {
      nextIndex = remaining.findIndex((item) => item.bookId !== last.bookId)
    }

    if (nextIndex === -1) {
      nextIndex = remaining.findIndex((item) => !usedBooks.has(item.bookId))
    }

    if (nextIndex === -1) {
      nextIndex = 0
    }

    const nextItem = remaining.splice(nextIndex, 1)[0]
    selections.push(nextItem)
    usedBooks.add(nextItem.bookId)
  }

  return selections
}

function buildQuestions(pool, questionCount) {
  const selections = pickQuestionOrder(pool, questionCount)
  const uniqueSpeakers = [...new Set(pool.map((item) => item.speaker).filter(Boolean))]
  const fallbackSpeakers = [...new Set(BIBLE_FIGURES.map((figure) => figure.name).filter(Boolean))]
  const figureTagsByName = new Map(
    BIBLE_FIGURES.map((figure) => [figure.name, Array.isArray(figure.tags) ? figure.tags : []]),
  )

  return selections.map((item) => {
    const isWomenSpeaker = figureTagsByName.get(item.speaker)?.includes("women")
    const basePool = uniqueSpeakers.filter((name) => name !== item.speaker)
    const extraPool = fallbackSpeakers.filter((name) => name !== item.speaker && !basePool.includes(name))
    const combinedPool = [...basePool, ...extraPool]
    const filteredPool = isWomenSpeaker
      ? combinedPool.filter((name) => figureTagsByName.get(name)?.includes("women"))
      : combinedPool
    const poolForOptions = filteredPool.length >= 3 ? filteredPool : combinedPool
    const distractors = shuffle(poolForOptions).slice(0, 3)
    const options = shuffle([item.speaker, ...distractors])
    return { ...item, options }
  })
}

export default function VerseSpeakerGame({ questionCount, sourceScope, sourceBookId, onComplete }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [answerResult, setAnswerResult] = useState(null)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])

  const currentQuestion = useMemo(() => questions[currentIndex] ?? null, [currentIndex, questions])
  const totalQuestions = questions.length
  const round = Math.min(currentIndex + (answerResult ? 1 : 0), totalQuestions)

  const prepareGame = useCallback(async () => {
    setLoading(true)
    setError("")
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer("")
    setAnswerResult(null)
    setScore(0)

    try {
      const pool = await collectSpeakerQuotes({
        sourceScope,
        sourceBookId,
        maxQuotes: Math.max(questionCount * 2, questionCount),
      })

      if (pool.length === 0) {
        throw new Error("No speaker quotes were found for this source.")
      }

      const builtQuestions = buildQuestions(pool, Math.min(questionCount, pool.length))
      setQuestions(builtQuestions)
    } catch (nextError) {
      setError(nextError.message || "Failed to prepare speaker questions.")
    } finally {
      setLoading(false)
    }
  }, [questionCount, sourceBookId, sourceScope])

  useEffect(() => {
    prepareGame()
  }, [prepareGame])

  function submitAnswer(speaker) {
    if (!currentQuestion || answerResult) return

    const correct = currentQuestion.speaker === speaker
    setSelectedAnswer(speaker)
    setAnswerResult(correct ? "correct" : "wrong")
    if (correct) {
      setScore((value) => value + 1)
    } else {
      setMistakes((items) => [
        ...items,
        {
          id: `${currentQuestion.bookId}:${currentQuestion.chapter}:${currentQuestion.verseNumber}`,
          prompt: currentQuestion.quote,
          correctAnswer: currentQuestion.speaker,
          yourAnswer: speaker,
        },
      ])
    }
  }

  function nextQuestion() {
    setSelectedAnswer("")
    setAnswerResult(null)
    setCurrentIndex((value) => value + 1)
  }

  function finishSession() {
    const accuracy = totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100)
    onComplete({ score, round: totalQuestions, accuracy, mistakes })
  }

  return (
    <>
      <div className="surface mt-6 p-4 text-sm">
        <p className="text-[var(--text)]">
          Progress:{" "}
          <span className="font-semibold">
            {Math.min(currentIndex + (answerResult ? 1 : 0), totalQuestions)} / {totalQuestions}
          </span>
        </p>
      </div>

      <div className="surface-soft mt-6 p-5">
        {loading && <p className="text-[var(--text-soft)]">Preparing speaker question...</p>}
        {!loading && error && <p className="text-[var(--danger)]">{error}</p>}

        {!loading && !error && currentQuestion && (
          <>
            <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">Who said this?</p>
            <p className="mt-3 rounded-lg border border-[var(--stroke)] bg-[var(--panel)] p-4 text-base leading-7 text-[var(--text)]">
              "{currentQuestion.quote}"
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer = answerResult && option === currentQuestion.speaker
                const isWrongSelected = answerResult === "wrong" && isSelected

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => submitAnswer(option)}
                    disabled={Boolean(answerResult)}
                    className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                      isCorrectAnswer
                        ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_22%,var(--panel))] text-[var(--text)]"
                        : isWrongSelected
                          ? "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_22%,var(--panel))] text-[var(--text)]"
                          : "border-[var(--stroke)] bg-[var(--panel)] text-[var(--text)] hover:border-[var(--accent)]"
                    } disabled:cursor-not-allowed`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {answerResult && (
              <div className="mt-5 rounded-lg border border-[var(--stroke)] bg-[var(--panel)] p-4 text-sm">
                <p className={answerResult === "correct" ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {answerResult === "correct" ? "Correct." : "Not correct."}
                </p>
                <p className="mt-2 text-[var(--text-soft)]">
                  Answer: {currentQuestion.speaker} ({currentQuestion.bookName} {currentQuestion.chapter}:
                  {currentQuestion.verseNumber})
                </p>
                {currentQuestion.listener && (
                  <p className="mt-2 text-[var(--text-soft)]">Listener: {currentQuestion.listener}</p>
                )}
                {currentIndex + 1 >= totalQuestions ? (
                  <button
                    type="button"
                    onClick={finishSession}
                    className="primary-btn mt-4 px-4 py-2 text-sm"
                  >
                    See Results
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="primary-btn mt-4 px-4 py-2 text-sm"
                  >
                    Next Question
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
