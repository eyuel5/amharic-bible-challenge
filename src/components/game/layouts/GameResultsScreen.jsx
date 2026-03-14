export default function GameResultsScreen({ result, onPlayAgain, onBackToSetup }) {
  return (
    <section className="mt-8 space-y-6">
      <div className="surface p-6">
        <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">Session Complete</p>
        <h2 className="title-font mt-2 text-3xl font-semibold text-[var(--text)]">Your Performance</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="surface-soft rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-soft)]">Mode</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{result.modeLabel}</p>
          </div>
          <div className="surface-soft rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-soft)]">Score</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">
              {result.score}/{result.round}
            </p>
          </div>
          <div className="surface-soft rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-soft)]">Accuracy</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{result.accuracy}%</p>
          </div>
        </div>
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
