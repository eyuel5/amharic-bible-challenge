export default function GameSetupScreen({
  modes,
  selectedModeId,
  onSelectMode,
  questionCount,
  onQuestionCountChange,
  sourceScope,
  onSourceScopeChange,
  sourceBookId,
  onSourceBookChange,
  sourceBooks,
  onStart,
}) {
  const selectedMode = modes.find((mode) => mode.id === selectedModeId) ?? modes[0]
  const canUseSingleBook = Boolean(selectedMode.allowSingleBookSource)

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-sm uppercase tracking-wide text-slate-400">Choose Mode</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {modes.map((mode) => {
            const selected = mode.id === selectedModeId
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSelectMode(mode.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-500/15"
                    : "border-slate-700 bg-slate-950 hover:border-slate-500"
                }`}
              >
                <p className="text-base font-semibold text-slate-100">{mode.label}</p>
                <p className="mt-1 text-sm text-slate-300">{mode.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-sm uppercase tracking-wide text-slate-400">Session Settings</p>

        <div className="mt-4">
          <p className="text-sm text-slate-300">Questions per session</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onQuestionCountChange(count)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  questionCount === count
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-slate-300">Question source</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "ot", label: "Old Testament" },
              { id: "nt", label: "New Testament" },
              ...(canUseSingleBook ? [{ id: "single", label: "Single Book" }] : []),
            ].map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => onSourceScopeChange(scope.id)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  sourceScope === scope.id
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>

          {!canUseSingleBook && (
            <p className="mt-3 text-xs text-slate-400">
              Single-book source is disabled for this mode because the player is guessing the book name.
            </p>
          )}

          {canUseSingleBook && sourceScope === "single" && (
            <div className="mt-4">
              <p className="text-sm text-slate-300">Select book</p>
              <select
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                value={sourceBookId}
                onChange={(event) => onSourceBookChange(event.target.value)}
              >
                {sourceBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.nameAm}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 sm:w-auto"
      >
        Start Game
      </button>
    </section>
  )
}
