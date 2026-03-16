import { useCallback, useEffect, useMemo, useState } from "react"
import { getAllBooks, getRandomVerse, loadBookById } from "../../../services/bibleService"

const allBooks = getAllBooks()
const fallbackDistractors = ["እግዚአብሔር", "ፍቅር", "ሕይወት", "ሰላም", "እምነት", "ቃል", "ጸጋ"]

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

function normalizeWord(word) {
  return word.toLocaleLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, "")
}

function stripEdgePunctuation(word) {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
}

function getEligibleTokens(text) {
  return text
    .split(/\s+/)
    .map((token, index) => ({
      index,
      raw: token,
      clean: stripEdgePunctuation(token),
      normalized: normalizeWord(token),
    }))
    .filter((token) => token.clean.length > 0 && token.normalized.length >= 2)
}

function maskToken(token) {
  const masked = token.replace(/[\p{L}\p{N}]/gu, "_")
  return masked.includes("_") ? masked : "____"
}

function buildQuestionText(text, targetIndex, maskedWord) {
  const tokens = text.split(/\s+/)
  const next = tokens.map((token, index) => (index === targetIndex ? maskedWord : token))
  return next.join(" ")
}

function buildWordOptions(correctWord, distractors, optionCount = 4) {
  const normalizedCorrect = normalizeWord(correctWord)
  const uniqueDistractors = []
  const seen = new Set([normalizedCorrect])

  distractors.forEach((word) => {
    const normalized = normalizeWord(word)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    uniqueDistractors.push(word)
  })

  const needed = Math.max(0, optionCount - 1 - uniqueDistractors.length)
  if (needed > 0) {
    fallbackDistractors.forEach((word) => {
      const normalized = normalizeWord(word)
      if (seen.has(normalized)) return
      seen.add(normalized)
      uniqueDistractors.push(word)
    })
  }

  return shuffle([correctWord, ...uniqueDistractors.slice(0, optionCount - 1)])
}

function collectVerseWords(verseText, correctWord) {
  return getEligibleTokens(verseText)
    .map((token) => token.clean)
    .filter((word) => normalizeWord(word) !== normalizeWord(correctWord))
}

async function collectBookDistractors(bookPayload, correctWord, minCount = 3) {
  const distractors = []
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts && distractors.length < minCount; attempt += 1) {
    const sampleVerse = getRandomVerse(bookPayload)
    if (!sampleVerse?.text) continue
    distractors.push(...collectVerseWords(sampleVerse.text, correctWord))
  }

  return distractors
}

export default function VerseRecallGame({ questionCount, sourceScope, sourceBookId, onComplete, labels }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [answerResult, setAnswerResult] = useState(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])

  const sourceBooks = useMemo(() => {
    if (sourceScope === "ot") return allBooks.filter((book) => book.testament === "ot")
    if (sourceScope === "nt") return allBooks.filter((book) => book.testament === "nt")
    if (sourceScope === "single") return allBooks.filter((book) => book.id === sourceBookId)
    return allBooks
  }, [sourceBookId, sourceScope])

  const createVerseRecallQuestion = useCallback(async () => {
    if (sourceBooks.length === 0) {
      throw new Error("No books found for the selected source.")
    }

    const maxAttempts = 12
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const bookMeta = pickRandom(sourceBooks)
      const payload = await loadBookById(bookMeta.id)
      const randomVerse = getRandomVerse(payload)
      if (!randomVerse?.text) continue

      const eligibleTokens = getEligibleTokens(randomVerse.text)
      if (eligibleTokens.length < 2) continue

      const targetToken = pickRandom(eligibleTokens)
      const answerWord = targetToken.clean
      const maskedWord = maskToken(targetToken.raw)
      const verseDistractors = collectVerseWords(randomVerse.text, answerWord)
      const bookDistractors = await collectBookDistractors(payload, answerWord)
      const options = buildWordOptions(answerWord, [...verseDistractors, ...bookDistractors])
      if (options.length < 2) continue

      return {
        prompt: buildQuestionText(randomVerse.text, targetToken.index, maskedWord),
        answerWord,
        answerChapter: randomVerse.chapter,
        answerVerseNumber: randomVerse.verseNumber,
        answerBookName: bookMeta.nameAm,
        options,
      }
    }

    throw new Error("Could not generate a fill-in-the-blank verse from the current dataset.")
  }, [sourceBooks])

  const startNextRound = useCallback(async () => {
    setLoading(true)
    setError("")
    setSelectedAnswer("")
    setAnswerResult(null)

    try {
      const question = await createVerseRecallQuestion()
      setCurrentQuestion(question)
    } catch (nextError) {
      setCurrentQuestion(null)
      setError(nextError.message || "Failed to prepare the next question.")
    } finally {
      setLoading(false)
    }
  }, [createVerseRecallQuestion])

  function submitAnswer(word) {
    if (!currentQuestion || answerResult) return

    const correct = normalizeWord(currentQuestion.answerWord) === normalizeWord(word)
    setSelectedAnswer(word)
    setAnswerResult(correct ? "correct" : "wrong")
    setRound((value) => value + 1)

    if (correct) {
      setScore((value) => value + 1)
    } else {
      setMistakes((items) => [
        ...items,
        {
          id: `${currentQuestion.answerBookName}:${currentQuestion.answerChapter}:${currentQuestion.answerVerseNumber}`,
          prompt: currentQuestion.prompt,
          correctAnswer: currentQuestion.answerWord,
          yourAnswer: word,
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
          <span className="font-semibold text-[var(--text-soft)]">Q.</span>
          <span className="font-semibold">
            {Math.min(round + (answerResult ? 0 : 1), questionCount)} / {questionCount}
          </span>
        </div>
      </div>

      <div className="surface-soft mt-6 p-5">
        {loading && <p className="text-[var(--text-soft)]">Preparing question...</p>}
        {!loading && error && <p className="text-[var(--danger)]">{error}</p>}

        {!loading && !error && currentQuestion && (
          <>
            <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">Complete the missing word</p>
            <p className="mt-3 rounded-lg border border-[var(--stroke)] bg-[var(--panel)] p-4 text-base leading-7 text-[var(--text)]">
              "{currentQuestion.prompt}"
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer =
                  answerResult && normalizeWord(option) === normalizeWord(currentQuestion.answerWord)
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
                  {answerResult === "correct" ? labels.correct : labels.notCorrect}
                </p>
                <p className="mt-2 text-[var(--text-soft)]">
                  {labels.answerLabel}: {currentQuestion.answerWord} ({currentQuestion.answerBookName} {currentQuestion.answerChapter}
                  :{currentQuestion.answerVerseNumber})
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
