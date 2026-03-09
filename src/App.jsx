import { useEffect, useMemo, useState } from "react"
import GameResultsScreen from "./components/game/GameResultsScreen"
import GameSetupScreen from "./components/game/GameSetupScreen"
import VerseToBookGame from "./components/game/VerseToBookGame"
import { getAllBooks, validateBooksCatalog } from "./services/bibleService"

const modes = [
  {
    id: "verse-to-book",
    label: "Verse to Book",
    description: "Read a verse and choose the correct book.",
    Component: VerseToBookGame,
    allowSingleBookSource: false,
  },
]

const allBooks = getAllBooks()

function App() {
  const [modeId, setModeId] = useState(modes[0].id)
  const [questionCount, setQuestionCount] = useState(10)
  const [sourceScope, setSourceScope] = useState("all")
  const [sourceBookId, setSourceBookId] = useState(allBooks[0]?.id ?? "")
  const [stage, setStage] = useState("setup")
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Amharic Bible Challenge</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Bible Quiz Game</h1>

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
      </section>
    </main>
  )
}

export default App
