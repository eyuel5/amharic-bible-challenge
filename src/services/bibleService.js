import { books } from "../data/bible/books.meta"
import { validateBibleBook, validateBookMeta } from "../data/schema/bibleSchema"

const bibleBookModules = import.meta.glob("../data/bible/books/*.json")
const bibleBookLoadersByFile = Object.fromEntries(
  Object.entries(bibleBookModules).map(([path, loader]) => [path.split("/").at(-1), loader]),
)

const sortedBooks = [...books].sort((a, b) => a.order - b.order)

/**
 * Returns metadata validation issues for the full catalog.
 * Helpful to call once during app bootstrap in development.
 */
export function validateBooksCatalog() {
  const issues = []
  const ids = new Set()
  const orders = new Set()
  const knownFiles = new Set(Object.keys(bibleBookLoadersByFile))

  sortedBooks.forEach((book, index) => {
    const result = validateBookMeta(book)
    if (!result.valid) {
      issues.push(`books[${index}] ${result.errors.join(" ")}`)
    }
    if (ids.has(book.id)) {
      issues.push(`Duplicate book id: ${book.id}`)
    }
    if (orders.has(book.order)) {
      issues.push(`Duplicate book order: ${book.order}`)
    }
    if (!knownFiles.has(book.file)) {
      issues.push(`Missing bible JSON file for ${book.id}: ${book.file}`)
    }
    ids.add(book.id)
    orders.add(book.order)
  })

  return {
    valid: issues.length === 0,
    issues,
  }
}

export function getAllBooks() {
  return sortedBooks
}

export function getBookById(id) {
  return sortedBooks.find((book) => book.id === id) ?? null
}

export function getBooksByTestament(testament) {
  return sortedBooks.filter((book) => book.testament === testament)
}

export async function loadBookByFile(file) {
  const loader = bibleBookLoadersByFile[file]
  if (!loader) {
    throw new Error(`Bible book file not found: ${file}`)
  }

  const loaded = await loader()
  const payload = loaded.default ?? loaded
  const schemaCheck = validateBibleBook(payload)

  if (!schemaCheck.valid) {
    throw new Error(`Invalid bible book JSON (${file}): ${schemaCheck.errors.join(" ")}`)
  }

  return payload
}

export async function loadBookById(id) {
  const meta = getBookById(id)
  if (!meta) {
    throw new Error(`Unknown book id: ${id}`)
  }
  return loadBookByFile(meta.file)
}

function pickRandom(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }
  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex]
}

function getChaptersWithVerses(book) {
  if (!book || !Array.isArray(book.chapters)) {
    return []
  }
  return book.chapters.filter((chapter) => Array.isArray(chapter.verses) && chapter.verses.length > 0)
}

/**
 * Picks a random chapter from a loaded bible book payload.
 * @param {import("../data/schema/bibleSchema").BibleBook} book
 */
export function getRandomChapter(book) {
  return pickRandom(getChaptersWithVerses(book))
}

/**
 * Picks a random verse from a loaded bible book payload.
 * Returns chapter + verse index + verse text for game use.
 * @param {import("../data/schema/bibleSchema").BibleBook} book
 */
export function getRandomVerse(book) {
  const chapter = getRandomChapter(book)
  if (!chapter) {
    return null
  }

  const verseText = pickRandom(chapter.verses)
  if (!verseText) {
    return null
  }

  return {
    chapter: chapter.chapter,
    chapterTitle: chapter.title ?? "",
    verseNumber: chapter.verses.indexOf(verseText) + 1,
    text: verseText,
  }
}
