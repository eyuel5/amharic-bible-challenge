import { useEffect, useMemo, useState } from "react"
import { BookOpen, Settings } from "lucide-react"
import GameResultsScreen from "./components/game/layouts/GameResultsScreen"
import GameSettingsScreen from "./components/game/layouts/GameSettingsScreen"
import GameSetupScreen from "./components/game/layouts/GameSetupScreen"
import BookOrderGame from "./components/game/modes/BookOrder"
import VerseRecallGame from "./components/game/modes/VerseRecall"
import VerseSpeakerGame from "./components/game/modes/VerseSpeaker"
import VerseToBookGame from "./components/game/modes/VerseToBook"
import { getAllBooks, validateBooksCatalog } from "./services/bibleService"

const copyByLanguage = {
  en: {
    title: "Amharic Bible Challenge",
    description: "A focused Bible quiz experience with purposeful modes and session-based play.",
    chooseMode: "Choose Mode",
    sessionSettings: "Session Settings",
    questionsPerSession: "Questions per session",
    questionSource: "Question source",
    singleBook: "Single Book",
    selectBook: "Select Book",
    singleBookDisabled:
      "Single-book source is disabled for this mode because the player is guessing the book name.",
    sources: {
      all: "All",
      ot: "Old Testament",
      nt: "New Testament",
    },
    settingsTitle: "Settings",
    themePresets: "Theme Presets",
    languageLabel: "Language",
    startGame: "Start Game",
    nextQuestion: "Next Question",
    playAgain: "Play Again",
    changeModeOrSettings: "Change Mode or Settings",
    answerLabel: "Answer",
    seeResults: "See Results",
    correct: "Correct.",
    notCorrect: "Not correct.",
    sessionComplete: "Session Complete",
    sessionSummary: "Session Summary",
    reviewMistakes: "Review Mistakes",
    hideMistakes: "Hide Mistakes",
    languageOptions: [
      { id: "am", label: "አማርኛ" },
      { id: "en", label: "English" },
    ],
    modes: {
      verseToBook: {
        label: "Verse to Book",
        description: "Read a verse and choose the correct book.",
      },
      verseRecall: {
        label: "Verse Recall",
        description: "Fill in the missing word from a verse.",
      },
      bookOrder: {
        label: "Book Order",
        description: "Choose the next Bible book in sequence.",
      },
      verseSpeaker: {
        label: "Verse Speaker",
        description: "Identify who said the verse from narrative books.",
      },
    },
  },
  am: {
    title: "የመጽሐፍ ቅዱስ ጥያቄዎች",
    description:
      "በተለያየ የጥያቄ አማራጮችና የአጠያየቅ መንገዶች፣ የመጽሐፍ ቅዱስ እውቀትዎን የሚፈትሹበት እና የሚማሩበት ቦታ።",
    chooseMode: "አይነት ይምረጡ",
    sessionSettings: "ማስተካከያ",
    questionsPerSession: "የጥያቄዎቹ ብዛት",
    questionSource: "የጥያቄዎቹ ምንጭ",
    singleBook: "አንድ መጽሐፍ",
    selectBook: "መጽሐፍ ይምረጡ",
    singleBookDisabled: "ለዚህ አይነት አንድ መጽሐፍ ብቻ መምረጥ አይፈቀድም",
    sources: {
      all: "ሁሉም",
      ot: "ብሉይ ኪዳን",
      nt: "አዲስ ኪዳን",
    },
    settingsTitle: "ማስተካከያ",
    themePresets: "የቅጥ ቅንብሮች",
    languageLabel: "ቋንቋ",
    startGame: "ጀምር",
    nextQuestion: "ቀጣይ ጥያቄ",
    playAgain: "እንደገና ተጫወት",
    changeModeOrSettings: "አይነት ቀይር ወይ ወደ ማስተካከያ",
    answerLabel: "መልስ",
    seeResults: "ውጤቱን ተመልከት",
    correct: "ትክክል!",
    notCorrect: "ትክክል አይደለም።",
    sessionComplete: "ጨዋታው ተጠናቋል",
    sessionSummary: "የጨዋታው ማጠቃለያ",
    reviewMistakes: "ስህተቶችን ተመልከት",
    hideMistakes: "ስህተቶችን ደብቅ",
    languageOptions: [
      { id: "am", label: "አማርኛ" },
      { id: "en", label: "English" },
    ],
    modes: {
      verseToBook: {
        label: "ጥቅሱን ለይተህ እወቅ",
        description: "ጥቅሱን አንብበህ የሚገኝበትን መጽሐፍ ምረጥ።",
      },
      verseRecall: {
        label: "ጥቅሱን አሟላ",
        description: "ከጥቅሱ ውስጥ የጎደለውን ቃል ሙላ።",
      },
      bookOrder: {
        label: "የመጻሕፍት ቅደም ተከተል",
        description: "የመጽሐፍ ቅዱስ መጻሕፍትን በቅደም ተከተላቸው መሠረት ምረጥ።",
      },
      verseSpeaker: {
        label: "ተናጋሪውን ለይ",
        description: "ጥቅሱን የተናገረውን አካል ለይተህ እወቅ።",
      },
    },
  },
}

const allBooks = getAllBooks()
const availableThemePacks = new Set([
  "serika-dark",
  "graphite",
  "ocean",
  "lotus",
  "sandstone",
  "inkwell",
  "dawn",
])

function App() {
  const [themePack, setThemePack] = useState(() => {
    const saved = window.localStorage.getItem("themePack")
    if (saved && availableThemePacks.has(saved)) return saved
    return "serika-dark"
  })
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem("language")
    return saved === "en" ? "en" : "am"
  })
  const labels = copyByLanguage[language] ?? copyByLanguage.am
  const modes = useMemo(
    () => [
      {
        id: "verse-to-book",
        ...labels.modes.verseToBook,
        Component: VerseToBookGame,
        allowSingleBookSource: false,
      },
      {
        id: "verse-recall",
        ...labels.modes.verseRecall,
        Component: VerseRecallGame,
        allowSingleBookSource: true,
      },
      {
        id: "book-order",
        ...labels.modes.bookOrder,
        Component: BookOrderGame,
        allowSingleBookSource: false,
      },
      {
        id: "verse-speaker",
        ...labels.modes.verseSpeaker,
        Component: VerseSpeakerGame,
        allowSingleBookSource: false,
      },
    ],
    [labels],
  )
  const [modeId, setModeId] = useState("verse-to-book")
  const [questionCount, setQuestionCount] = useState(10)
  const [sourceScope, setSourceScope] = useState("all")
  const [sourceBookId, setSourceBookId] = useState(allBooks[0]?.id ?? "")
  const [stage, setStage] = useState("setup")
  const [previousStage, setPreviousStage] = useState("setup")
  const [sessionResult, setSessionResult] = useState(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [sessionStartAt, setSessionStartAt] = useState(null)

  const activeMode = useMemo(() => {
    return modes.find((mode) => mode.id === modeId) ?? modes[0]
  }, [modeId])

  const effectiveSourceScope =
    !activeMode.allowSingleBookSource && sourceScope === "single" ? "all" : sourceScope

  useEffect(() => {
    const check = validateBooksCatalog()
    if (!check.valid) {
      console.warn("Book metadata issues:", check.issues)
    }
  }, [])

  useEffect(() => {
    document.body.setAttribute("data-theme-pack", themePack)
    window.localStorage.setItem("themePack", themePack)
  }, [themePack])

  useEffect(() => {
    window.localStorage.setItem("language", language)
  }, [language])

  const ActiveGameComponent = activeMode.Component

  function startSession() {
    setSessionResult(null)
    setSessionKey((value) => value + 1)
    setSessionStartAt(Date.now())
    setStage("playing")
  }

  function handleSessionComplete(result) {
    const durationSeconds = sessionStartAt ? Math.round((Date.now() - sessionStartAt) / 1000) : null
    const sourceLabel =
      effectiveSourceScope === "single"
        ? allBooks.find((book) => book.id === sourceBookId)?.nameAm ?? "Single Book"
        : effectiveSourceScope.toUpperCase()
    const statsKey =
      effectiveSourceScope === "single"
        ? `${activeMode.id}:${effectiveSourceScope}:${sourceBookId}`
        : `${activeMode.id}:${effectiveSourceScope}:all`
    let best = null
    let last = null
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(`sessionStats:${statsKey}`)
        const parsed = raw ? JSON.parse(raw) : null
        best = parsed?.best ?? null
        last = parsed?.last ?? null
      } catch (error) {
        best = null
        last = null
      }
    }

    const currentStats = {
      score: result.score,
      round: result.round,
      ratio: result.round > 0 ? result.score / result.round : 0,
    }
    const nextBest =
      !best || currentStats.ratio > best.ratio ? currentStats : best
    const nextLast = currentStats
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          `sessionStats:${statsKey}`,
          JSON.stringify({ best: nextBest, last: nextLast }),
        )
      } catch (error) {
        // Ignore storage errors (private mode, quota, etc.)
      }
    }

    setSessionResult({
      ...result,
      modeId: activeMode.id,
      modeLabel: activeMode.label,
      questionCount,
      sourceScope: effectiveSourceScope,
      sourceBookId,
      sourceLabel,
      durationSeconds,
      best: nextBest ?? best,
      last: nextLast ?? last,
    })
    setStage("results")
  }

  function playAgain() {
    setSessionKey((value) => value + 1)
    setStage("playing")
  }

  function openSettings() {
    setPreviousStage(stage)
    setStage("settings")
  }

  function closeSettings() {
    setStage(previousStage === "settings" ? "setup" : previousStage)
  }

  return (
    <main className="app-shell">
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-10">
        <header className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h1 className="title-font mt-2 inline-flex items-center gap-2 text-xl font-medium tracking-wide text-[var(--text)] sm:text-2xl">
              <BookOpen size={18} />
              {labels.title}
            </h1>
            {stage === "setup" && (
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                {labels.description}
              </p>
            )}
          </div>
          {(stage === "setup" || stage === "results") && (
            <button
              type="button"
              onClick={openSettings}
              className="chip-btn inline-flex h-11 w-11 items-center justify-center self-start"
              aria-label="Open settings"
            >
              <Settings size={18} />
            </button>
          )}
        </header>

        {stage === "setup" && (
          <GameSetupScreen
            modes={modes}
            selectedModeId={modeId}
            onSelectMode={setModeId}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            sourceScope={effectiveSourceScope}
            onSourceScopeChange={setSourceScope}
            sourceBookId={sourceBookId}
            onSourceBookChange={setSourceBookId}
            sourceBooks={allBooks}
            onStart={startSession}
            labels={labels}
          />
        )}

        {stage === "playing" && (
          <ActiveGameComponent
            key={`${modeId}-${sessionKey}`}
            questionCount={questionCount}
            sourceScope={effectiveSourceScope}
            sourceBookId={sourceBookId}
            onComplete={handleSessionComplete}
            labels={labels}
          />
        )}

        {stage === "results" && sessionResult && (
          <GameResultsScreen
            result={sessionResult}
            onPlayAgain={playAgain}
            onBackToSetup={() => setStage("setup")}
            labels={labels}
          />
        )}

        {stage === "settings" && (
          <section className="mt-8 space-y-4">
            <GameSettingsScreen
              themePack={themePack}
              onThemePackChange={setThemePack}
              language={language}
              onLanguageChange={setLanguage}
              labels={labels}
            />
            <button type="button" onClick={closeSettings} className="ghost-btn px-5 py-3 text-sm">
              Back
            </button>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
