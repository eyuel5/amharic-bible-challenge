import { useMemo, useState } from "react"

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return null
  const safe = Math.max(0, seconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${String(secs).padStart(2, "0")}`
}

export default function GameResultsScreen({ result, onPlayAgain, onBackToSetup }) {
  const [showMistakes, setShowMistakes] = useState(false)
  const durationLabel = useMemo(() => formatDuration(result.durationSeconds), [result.durationSeconds])
  const mistakes = Array.isArray(result.mistakes) ? result.mistakes : []
  const previewMistakes = mistakes.slice(0, 3)

  return (
    <section className="mt-8 space-y-6">
      <div className="surface p-6">
        <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">Session Complete</p>
        <h2 className="title-font mt-2 text-3xl font-semibold text-[var(--text)]">Session Summary</h2>

        <p className="mt-4 text-sm text-[var(--text)]">
          <span className="font-semibold">Score:</span> {result.score}/{result.round}
          <span className="mx-2 text-[var(--text-soft)]">•</span>
          <span className="font-semibold">Mode:</span> {result.modeLabel}
          <span className="mx-2 text-[var(--text-soft)]">•</span>
          <span className="font-semibold">Source:</span> {result.sourceLabel ?? "All"}
        </p>

        {(durationLabel || result.best || result.last) && (
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            {durationLabel && (
              <>
                <span className="font-semibold text-[var(--text)]">Time:</span> {durationLabel}
              </>
            )}
            {durationLabel && (result.best || result.last) && (
              <span className="mx-2 text-[var(--text-soft)]">•</span>
            )}
            {result.best && (
              <>
                <span className="font-semibold text-[var(--text)]">Best:</span>{" "}
                {result.best.score}/{result.best.round}
              </>
            )}
            {result.best && result.last && (
              <span className="mx-2 text-[var(--text-soft)]">•</span>
            )}
            {result.last && (
              <>
                <span className="font-semibold text-[var(--text)]">Last:</span>{" "}
                {result.last.score}/{result.last.round}
              </>
            )}
          </p>
        )}

        {mistakes.length > 0 && (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setShowMistakes((value) => !value)}
              className="ghost-btn px-4 py-2 text-xs"
            >
              {showMistakes ? "Hide Mistakes" : "Review Mistakes"}
            </button>
            {showMistakes && (
              <div className="surface-soft rounded-lg p-4 text-sm text-[var(--text)]">
                <p className="text-xs uppercase tracking-wide text-[var(--text-soft)]">
                  Missed Questions (preview)
                </p>
                <div className="mt-3 space-y-2">
                  {previewMistakes.map((item, index) => (
                    <p key={`${item.id ?? item.prompt ?? "mistake"}-${index}`}>
                      {item.prompt}{" "}
                      <span className="text-[var(--text-soft)]">→</span>{" "}
                      <span className="font-semibold">{item.correctAnswer}</span>
                    </p>
                  ))}
                  {mistakes.length > previewMistakes.length && (
                    <p className="text-[var(--text-soft)]">
                      + {mistakes.length - previewMistakes.length} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="primary-btn px-5 py-3 text-sm"
        >
          Play Again
        </button>
        <button
          type="button"
          onClick={onBackToSetup}
          className="ghost-btn px-5 py-3 text-sm"
        >
          Change Mode or Settings
        </button>
      </div>
    </section>
  )
}
