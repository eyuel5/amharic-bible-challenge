import { useEffect, useMemo, useState } from "react"
import { Settings } from "lucide-react"
import GameResultsScreen from "./components/game/layouts/GameResultsScreen"
import GameSettingsScreen from "./components/game/layouts/GameSettingsScreen"
import GameSetupScreen from "./components/game/layouts/GameSetupScreen"
import BookOrderGame from "./components/game/modes/BookOrder"
import VerseRecallGame from "./components/game/modes/VerseRecall"
import VerseSpeakerGame from "./components/game/modes/VerseSpeaker"
import VerseToBookGame from "./components/game/modes/VerseToBook"
import { getAllBooks, validateBooksCatalog } from "./services/bibleService"

const modes = [
  {
    id: "verse-to-book",
    label: "Verse to Book",
    description: "Read a verse and choose the correct book.",
    Component: VerseToBookGame,
    allowSingleBookSource: false,
  },
  {
    id: "verse-recall",
    label: "Verse Recall",
    description: "Fill in the missing word from a verse.",
    Component: VerseRecallGame,
    allowSingleBookSource: true,
  },
  {
    id: "book-order",
    label: "Book Order",
    description: "Choose the next Bible book in sequence.",
    Component: BookOrderGame,
    allowSingleBookSource: false,
  },
  {
    id: "verse-speaker",
    label: "Verse Speaker",
    description: "Identify who said the verse from narrative books.",
    Component: VerseSpeakerGame,
    allowSingleBookSource: true,
  },
]

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
  const [modeId, setModeId] = useState(modes[0].id)
  const [questionCount, setQuestionCount] = useState(10)
  const [sourceScope, setSourceScope] = useState("all")
  const [sourceBookId, setSourceBookId] = useState(allBooks[0]?.id ?? "")
  const [stage, setStage] = useState("setup")
  const [previousStage, setPreviousStage] = useState("setup")
  const [sessionResult, setSessionResult] = useState(null)
  const [sessionKey, setSessionKey] = useState(0)

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

  const ActiveGameComponent = activeMode.Component

  function startSession() {
    setSessionResult(null)
    setSessionKey((value) => value + 1)
    setStage("playing")
  }

  function handleSessionComplete(result) {
    setSessionResult({
      ...result,
      modeId: activeMode.id,
      modeLabel: activeMode.label,
      questionCount,
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
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">Amharic Bible Challenge</p>
            <h1 className="title-font mt-2 text-4xl font-semibold sm:text-5xl">Scripture Quest</h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              A focused Bible quiz experience with purposeful modes and session-based play.
            </p>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="chip-btn inline-flex h-11 w-11 items-center justify-center self-start"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
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
          />
        )}

        {stage === "playing" && (
          <ActiveGameComponent
            key={`${modeId}-${sessionKey}`}
            questionCount={questionCount}
            sourceScope={effectiveSourceScope}
            sourceBookId={sourceBookId}
            onComplete={handleSessionComplete}
          />
        )}

        {stage === "results" && sessionResult && (
          <GameResultsScreen
            result={sessionResult}
            onPlayAgain={playAgain}
            onBackToSetup={() => setStage("setup")}
          />
        )}

        {stage === "settings" && (
          <section className="mt-8 space-y-4">
            <GameSettingsScreen themePack={themePack} onThemePackChange={setThemePack} />
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
