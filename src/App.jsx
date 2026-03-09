import { useEffect, useMemo, useState } from "react"
import {
  getAllBooks,
  getRandomChapter,
  getRandomVerse,
  loadBookById,
  validateBooksCatalog,
} from "./services/bibleService"

const allBooks = getAllBooks()

function App() {
  const [testamentFilter, setTestamentFilter] = useState("all")
  const [selectedBookId, setSelectedBookId] = useState(allBooks[0]?.id ?? "")
  const [selectedBook, setSelectedBook] = useState(null)
  const [randomChapter, setRandomChapter] = useState(null)
  const [randomVerse, setRandomVerse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const filteredBooks = useMemo(() => {
    if (testamentFilter === "all") return allBooks
    return allBooks.filter((book) => book.testament === testamentFilter)
  }, [testamentFilter])

  useEffect(() => {
    if (!filteredBooks.some((book) => book.id === selectedBookId)) {
      setSelectedBookId(filteredBooks[0]?.id ?? "")
    }
  }, [filteredBooks, selectedBookId])

  useEffect(() => {
    if (!selectedBookId) return

    let isMounted = true
    setLoading(true)
    setError("")
    setRandomChapter(null)
    setRandomVerse(null)

    loadBookById(selectedBookId)
      .then((book) => {
        if (!isMounted) return
        setSelectedBook(book)
      })
      .catch((loadError) => {
        if (!isMounted) return
        setSelectedBook(null)
        setError(loadError.message || "Failed to load selected book.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedBookId])

  useEffect(() => {
    const check = validateBooksCatalog()
    if (!check.valid) {
      console.warn("Book metadata issues:", check.issues)
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Amharic Bible Challenge</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Bible Data Picker</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Pick a book from your real JSON dataset and test random chapter/verse helpers.
        </p>

        <div className="mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm text-slate-300">Testament</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={testamentFilter}
              onChange={(event) => setTestamentFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="ot">Old Testament</option>
              <option value="nt">New Testament</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm text-slate-300">Book</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={selectedBookId}
              onChange={(event) => setSelectedBookId(event.target.value)}
            >
              {filteredBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.order}. {book.nameAm}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedBook || loading}
            onClick={() => setRandomChapter(getRandomChapter(selectedBook))}
          >
            Random Chapter
          </button>
          <button
            type="button"
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedBook || loading}
            onClick={() => setRandomVerse(getRandomVerse(selectedBook))}
          >
            Random Verse
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
          {loading && <p className="text-slate-300">Loading selected book...</p>}
          {!loading && error && <p className="text-rose-400">{error}</p>}
          {!loading && !error && selectedBook && (
            <>
              <p className="text-slate-200">
                <span className="font-semibold">Title:</span> {selectedBook.title}
              </p>
              <p className="mt-1 text-slate-300">
                <span className="font-semibold text-slate-200">Chapters:</span>{" "}
                {selectedBook.chapters?.length ?? 0}
              </p>
            </>
          )}
        </div>

        {randomChapter && (
          <div className="mt-4 rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-4 text-sm text-emerald-100">
            <p>
              Random chapter: <span className="font-semibold">{randomChapter.chapter}</span>
            </p>
            <p className="mt-1 text-emerald-200/90">Verses: {randomChapter.verses.length}</p>
          </div>
        )}

        {randomVerse && (
          <div className="mt-4 rounded-xl border border-sky-700/40 bg-sky-950/30 p-4 text-sm text-sky-100">
            <p>
              Random verse: Chapter {randomVerse.chapter}, Verse {randomVerse.verseNumber}
            </p>
            <p className="mt-2 text-sky-50">{randomVerse.text}</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
