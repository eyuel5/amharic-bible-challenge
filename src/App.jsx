import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, Settings } from "lucide-react"
import GameResultsScreen from "./components/game/layouts/GameResultsScreen"
import GameSettingsScreen from "./components/game/layouts/GameSettingsScreen"
import GameSetupScreen from "./components/game/layouts/GameSetupScreen"
import BookOrderGame from "./components/game/modes/BookOrder"
import GeneralTriviaGame from "./components/game/modes/GeneralTrivia"
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
    questionShort: "Q.",
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
    changeModeOrSettings: "Change Mode",
    answerLabel: "Answer",
    seeResults: "See Results",
    correct: "Correct.",
    notCorrect: "Not correct.",
    sessionComplete: "Session Complete",
    sessionSummary: "Session Summary",
    reviewMistakes: "Review Mistakes",
    hideMistakes: "Hide Mistakes",
    scoreLabel: "Score",
    modeLabel: "Mode",
    sourceLabel: "Source",
    referenceLabel: "Reference",
    timeLabel: "Time",
    bestLabel: "Best",
    lastLabel: "Last",
    missedQuestionsLabel: "Missed Questions (preview)",
    preparingQuestion: "Preparing question...",
    whichBookPrompt: "Which book is this verse from?",
    chooseAnswerPrompt: "Choose the correct answer",
    bookOrderTitle: "Book Order",
    completeMissingWord: "Complete the missing word",
    whoSaidThis: "Who said this?",
    comesAfter: "Which book comes after",
    comesBefore: "Which book comes before",
    comesAfterPrefix: "Which book comes after",
    comesAfterSuffix: "?",
    comesBeforePrefix: "Which book comes before",
    comesBeforeSuffix: "?",
    listenerLabel: "Listener",
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
      generalTrivia: {
        label: "General Trivia",
        description: "Answer classic Bible questions across people, events, and places.",
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
    questionShort: "ጥ.",
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
    themePresets: "የገጽታ ምርጫዎች",
    languageLabel: "ቋንቋ",
    startGame: "ጀምር",
    nextQuestion: "ቀጣይ ጥያቄ",
    playAgain: "እንደገና ተጠየቅ",
    changeModeOrSettings: "የጥያቄውን አይነት ቀይር",
    answerLabel: "መልስ",
    seeResults: "ውጤቱን ተመልከት",
    correct: "ትክክል!",
    notCorrect: "ትክክል አይደለም።",
    sessionComplete: "ጥያቄው ተጠናቋል",
    sessionSummary: "ማጠቃለያ",
    reviewMistakes: "ስህተቶችን ተመልከት",
    hideMistakes: "ስህተቶችን ደብቅ",
    scoreLabel: "ውጤት",
    modeLabel: "የጥያቄው አይነት",
    sourceLabel: "ምንጭ",
    referenceLabel: "ማጣቀሻ",
    timeLabel: "ሰዓት",
    bestLabel: "ከፍተኛ ውጤት",
    lastLabel: "ያለፈው ውጤት",
    missedQuestionsLabel: "የተሳሳቱ ጥያቄዎች (በጥቂቱ)",
    preparingQuestion: "ጥያቄውን በማዘጋጀት ላይ...",
    whichBookPrompt: "ይህ ጥቅስ ከየትኛው መጽሐፍ የተወሰደ ነው?",
    chooseAnswerPrompt: "ትክክለኛውን መልስ ምረጥ",
    bookOrderTitle: "የመጻሕፍት ቅደም ተከተል",
    completeMissingWord: "የጎደለውን ቃል አሟላ",
    whoSaidThis: "ይህንን የተናገረው ማን ነው?",
    comesAfter: "ከ... ቀጥሎ የሚመጣው መጽሐፍ የትኛው ነው?",
    comesBefore: "ከ... በፊት የሚመጣው መጽሐፍ የትኛው ነው?",
    comesAfterPrefix: "ከ",
    comesAfterSuffix: "ቀጥሎ የሚመጣው መጽሐፍ የትኛው ነው?",
    comesBeforePrefix: "ከ",
    comesBeforeSuffix: "በፊት የሚመጣው መጽሐፍ የትኛው ነው?",
    listenerLabel: "አድማጭ",
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
      generalTrivia: {
        label: "አጠቃላይ ጥያቄዎች",
        description: "ሰዎችን፣ ክስተቶችን እና ቦታዎችን የሚመለከቱ አጠቃላይ ጥያቄዎችን መልስ።",
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
    return "ocean"
  })
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem("language")
    return saved === "en" ? "en" : "am"
  })
  const labels = copyByLanguage[language] ?? copyByLanguage.am
  const modes = useMemo(
    () => [
      {
        id: "general-trivia",
        ...labels.modes.generalTrivia,
        Component: GeneralTriviaGame,
        allowSingleBookSource: true,
      },
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
  const [modeId, setModeId] = useState("general-trivia")
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
  }, [modeId, modes])

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
    if (!window.matchMedia("(max-width: 639px)").matches) return
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [stage, sessionKey])

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
        ? allBooks.find((book) => book.id === sourceBookId)?.nameAm ?? labels.singleBook
        : labels.sources[effectiveSourceScope] ?? effectiveSourceScope.toUpperCase()
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
      } catch {
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
      } catch {
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
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
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
              className="chip-btn inline-flex h-9 w-9 shrink-0 items-center justify-center self-start sm:h-11 sm:w-11"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          {stage === "settings" && (
            <button
              type="button"
              onClick={closeSettings}
              className="chip-btn inline-flex h-9 w-9 shrink-0 items-center justify-center self-start sm:h-11 sm:w-11"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
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
          <section className="mt-8">
            <GameSettingsScreen
              themePack={themePack}
              onThemePackChange={setThemePack}
              language={language}
              onLanguageChange={setLanguage}
              labels={labels}
            />
          </section>
        )}
      </section>
    </main>
  )
}

export default App
