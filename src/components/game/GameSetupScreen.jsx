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
      <div className="surface p-6">
        <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">Choose Mode</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {modes.map((mode) => {
            const selected = mode.id === selectedModeId
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSelectMode(mode.id)}
                className={`mode-card p-4 text-left ${selected ? "active" : ""}`}
              >
                <p className="title-font text-base font-semibold text-[var(--text)]">{mode.label}</p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{mode.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="surface-soft p-6">
        <p className="text-sm uppercase tracking-wide text-[var(--text-soft)]">Session Settings</p>

        <div className="mt-4">
          <p className="text-sm text-[var(--text-soft)]">Questions per session</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onQuestionCountChange(count)}
                className={`chip-btn px-3 py-2 text-sm ${questionCount === count ? "active" : ""}`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-[var(--text-soft)]">Question source</p>
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
                className={`chip-btn px-3 py-2 text-sm ${sourceScope === scope.id ? "active" : ""}`}
              >
                {scope.label}
              </button>
            ))}
          </div>

          {!canUseSingleBook && (
            <p className="mt-3 text-xs text-[var(--text-soft)]">
              Single-book source is disabled for this mode because the player is guessing the book name.
            </p>
          )}

          {canUseSingleBook && sourceScope === "single" && (
            <div className="mt-4">
              <p className="text-sm text-[var(--text-soft)]">Select book</p>
              <select
                className="mt-2 w-full rounded-md border border-[var(--stroke)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
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
        className="primary-btn w-full px-5 py-3 text-sm sm:w-auto"
      >
        Start Game
      </button>
    </section>
  )
}
