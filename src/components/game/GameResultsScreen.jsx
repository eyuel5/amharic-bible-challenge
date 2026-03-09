export default function GameResultsScreen({ result, onPlayAgain, onBackToSetup }) {
  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-sm uppercase tracking-wide text-slate-400">Session Complete</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-100">Your Performance</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Mode</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{result.modeLabel}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Score</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {result.score}/{result.round}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Accuracy</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{result.accuracy}%</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Play Again
        </button>
        <button
          type="button"
          onClick={onBackToSetup}
          className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-100"
        >
          Change Mode or Settings
        </button>
      </div>
    </section>
  )
}
