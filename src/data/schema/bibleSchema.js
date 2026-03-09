/**
 * @typedef {"ot" | "nt"} Testament
 *
 * @typedef {Object} BookMeta
 * @property {string} id
 * @property {number} order
 * @property {string} nameAm
 * @property {Testament} testament
 * @property {string} file
 *
 * @typedef {Object} BibleChapter
 * @property {string | number} chapter
 * @property {string} [title]
 * @property {string[]} verses
 *
 * @typedef {Object} BibleBook
 * @property {string} title
 * @property {string} [abbv]
 * @property {BibleChapter[]} chapters
 */

const TESTAMENT_SET = new Set(["ot", "nt"])

function isString(value) {
  return typeof value === "string"
}

function isStringOrNumber(value) {
  return typeof value === "string" || typeof value === "number"
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0
}

/**
 * @param {unknown} meta
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBookMeta(meta) {
  const errors = []

  if (!meta || typeof meta !== "object") {
    return { valid: false, errors: ["Book metadata must be an object."] }
  }

  const item = /** @type {BookMeta} */ (meta)

  if (!isString(item.id) || item.id.length < 2) {
    errors.push("id must be a string with at least 2 characters.")
  }
  if (!isPositiveInt(item.order)) {
    errors.push("order must be a positive integer.")
  }
  if (!isString(item.nameAm) || item.nameAm.length === 0) {
    errors.push("nameAm must be a non-empty string.")
  }
  if (!TESTAMENT_SET.has(item.testament)) {
    errors.push('testament must be "ot" or "nt".')
  }
  if (!isString(item.file) || !item.file.endsWith(".json")) {
    errors.push("file must be a .json filename.")
  }

  return { valid: errors.length === 0, errors }
}

/**
 * @param {unknown} book
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBibleBook(book) {
  const errors = []

  if (!book || typeof book !== "object") {
    return { valid: false, errors: ["Bible book payload must be an object."] }
  }

  const item = /** @type {BibleBook} */ (book)

  if (!isString(item.title) || item.title.length === 0) {
    errors.push("title must be a non-empty string.")
  }

  if (item.abbv != null && !isString(item.abbv)) {
    errors.push("abbv must be a string when present.")
  }

  if (!Array.isArray(item.chapters) || item.chapters.length === 0) {
    errors.push("chapters must be a non-empty array.")
    return { valid: false, errors }
  }

  item.chapters.forEach((chapter, chapterIndex) => {
    const prefix = `chapters[${chapterIndex}]`

    if (!chapter || typeof chapter !== "object") {
      errors.push(`${prefix} must be an object.`)
      return
    }
    if (!isStringOrNumber(chapter.chapter)) {
      errors.push(`${prefix}.chapter must be a string or number.`)
    }
    if (chapter.title != null && !isString(chapter.title)) {
      errors.push(`${prefix}.title must be a string when present.`)
    }
    if (!Array.isArray(chapter.verses) || chapter.verses.length === 0) {
      errors.push(`${prefix}.verses must be a non-empty string array.`)
      return
    }
    const hasInvalidVerse = chapter.verses.some((verse) => !isString(verse))
    if (hasInvalidVerse) {
      errors.push(`${prefix}.verses must only contain strings.`)
    }
  })

  return { valid: errors.length === 0, errors }
}

