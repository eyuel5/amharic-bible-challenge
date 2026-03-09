import { useCallback, useEffect, useMemo, useState } from "react"
import { getAllBooks, getRandomVerse, loadBookById } from "../../services/bibleService"

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

function getBookOptions(correctBookId, candidateBooks, optionCount = 4) {
  const sourcePool = candidateBooks.length >= optionCount ? candidateBooks : allBooks
  const distractors = shuffle(sourcePool.filter((book) => book.id !== correctBookId)).slice(0, optionCount - 1)
  const correctBook = allBooks.find((book) => book.id === correctBookId)
  return shuffle([correctBook, ...distractors].filter(Boolean))
}

export default function VerseToBookGame({ questionCount, sourceScope, sourceBookId, onComplete }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswerId, setSelectedAnswerId] = useState("")
  const [answerResult, setAnswerResult] = useState(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)

  const sourceBooks = useMemo(() => {
    if (sourceScope === "ot") return allBooks.filter((book) => book.testament === "ot")
    if (sourceScope === "nt") return allBooks.filter((book) => book.testament === "nt")
    if (sourceScope === "single") return allBooks.filter((book) => book.id === sourceBookId)
    return allBooks
  }, [sourceBookId, sourceScope])

  const createVerseToBookQuestion = useCallback(async () => {
    if (sourceBooks.length === 0) {
      throw new Error("No books found for the selected source.")
    }

    const maxAttempts = 10
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const bookMeta = pickRandom(sourceBooks)
      const payload = await loadBookById(bookMeta.id)
      const randomVerse = getRandomVerse(payload)

      if (!randomVerse?.text) continue

      return {
        prompt: randomVerse.text,
        answerBookId: bookMeta.id,
        answerBookName: bookMeta.nameAm,
        answerChapter: randomVerse.chapter,
        answerVerseNumber: randomVerse.verseNumber,
        options: getBookOptions(bookMeta.id, sourceBooks),
      }
    }

    throw new Error("Could not generate a valid verse question from the current dataset.")
  }, [sourceBooks])

  const startNextRound = useCallback(async () => {
    setLoading(true)
    setError("")
    setSelectedAnswerId("")
    setAnswerResult(null)

    try {
      const question = await createVerseToBookQuestion()
      setCurrentQuestion(question)
    } catch (nextError) {
      setCurrentQuestion(null)
      setError(nextError.message || "Failed to prepare the next question.")
    } finally {
      setLoading(false)
    }
  }, [createVerseToBookQuestion])

  function submitAnswer(bookId) {
    if (!currentQuestion || answerResult) return

    const correct = currentQuestion.answerBookId === bookId
    setSelectedAnswerId(bookId)
    setAnswerResult(correct ? "correct" : "wrong")
    setRound((value) => value + 1)

    if (correct) {
      setScore((value) => value + 1)
    }
  }

  function finishSession() {
    const accuracy = round === 0 ? 0 : Math.round((score / round) * 100)
    onComplete({ score, round, accuracy })
  }

  useEffect(() => {
    startNextRound()
  }, [startNextRound])

  return (
    <>
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
        <p className="text-slate-200">
          Progress:{" "}
          <span className="font-semibold">
            {Math.min(round + (answerResult ? 0 : 1), questionCount)} / {questionCount}
          </span>
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        {loading && <p className="text-slate-300">Preparing question...</p>}
        {!loading && error && <p className="text-rose-400">{error}</p>}

        {!loading && !error && currentQuestion && (
          <>
            <p className="text-sm uppercase tracking-wide text-slate-400">Which book is this verse from?</p>
            <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-4 text-base leading-7 text-slate-100">
              "{currentQuestion.prompt}"
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswerId === option.id
                const isCorrectAnswer = answerResult && option.id === currentQuestion.answerBookId
                const isWrongSelected = answerResult === "wrong" && isSelected

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => submitAnswer(option.id)}
                    disabled={Boolean(answerResult)}
                    className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                      isCorrectAnswer
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-100"
                        : isWrongSelected
                          ? "border-rose-500 bg-rose-500/20 text-rose-100"
                          : "border-slate-700 bg-slate-950 text-slate-100 hover:border-slate-500"
                    } disabled:cursor-not-allowed`}
                  >
                    {option.nameAm}
                  </button>
                )
              })}
            </div>

            {answerResult && (
              <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm">
                <p className={answerResult === "correct" ? "text-emerald-400" : "text-rose-400"}>
                  {answerResult === "correct" ? "Correct." : "Not correct."}
                </p>
                <p className="mt-2 text-slate-300">
                  Answer: {currentQuestion.answerBookName} (Chapter {currentQuestion.answerChapter}, Verse{" "}
                  {currentQuestion.answerVerseNumber})
                </p>
                {round >= questionCount ? (
                  <button
                    type="button"
                    onClick={finishSession}
                    className="mt-4 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    See Results
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startNextRound}
                    className="mt-4 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
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
