import { BIBLE_FIGURES } from "../data/bible/bibleFigures"
import { getAllBooks, loadBookById } from "./bibleService"

export const NARRATIVE_SPEECH_BOOKS = [
  "gen",
  "exo",
  "num",
  "jos",
  "jdg",
  "rut",
  "1sa",
  "2sa",
  "1ki",
  "2ki",
  "1ch",
  "2ch",
  "ezr",
  "neh",
  "est",
  "job",
  "dan",
  "jon",
  "hab",
  "mat",
  "mrk",
  "luk",
  "jhn",
  "act",
]

export const SPEECH_VERBS = ["መልሶ", "መልሳ", "መልሰው"]

export const ENDING_SPEECH_VERBS = [
  "አለ",
  "አሉ",
  "አለው",
  "አላት",
  "አላቸው",
  "አሉት",
  "አሉአት",
  "አለቻቸው",
  "አለች",
  "መለሰ",
  "መለሱ",
  "ተናገረ",
  "ተናገሩ",
  "መለሰችላቸው",
]

export const INTRO_PRONOUNS = ["እርሱ", "እርሱም", "እርስዋ", "እርስዋም", "እነርሱ", "እነርሱም"]

export const PUNCTUATIONS = ["፣", "።", "፤", "፥", "፦", "“", "”", "‘", "’", "(", ")", ",", ".", "?", "!", "-", "\"", "'"]

const FULL_STOP = "።"
const QUESTION_MARK = "?"
const SPEECH_VERB_SET = new Set(SPEECH_VERBS)
const ENDING_VERB_SET = new Set(ENDING_SPEECH_VERBS)
const PUNCTUATION_CLASS = PUNCTUATIONS.map((char) => `\\${char}`).join("")

const figureAliasIndex = BIBLE_FIGURES.flatMap((figure) => {
  const aliases = Array.isArray(figure.aliases) && figure.aliases.length > 0 ? figure.aliases : [figure.name]
  return aliases.map((alias) => ({
    id: figure.id,
    name: figure.name,
    alias,
    books: figure.books ?? [],
  }))
})

const aliasesByBookId = new Map()

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getAliasesForBook(bookId) {
  if (!bookId) return figureAliasIndex
  if (aliasesByBookId.has(bookId)) return aliasesByBookId.get(bookId)

  const filtered = figureAliasIndex.filter((entry) => entry.books?.includes(bookId))
  const result = filtered.length > 0 ? filtered : figureAliasIndex
  aliasesByBookId.set(bookId, result)
  return result
}

function stripEdgePunctuation(text) {
  if (!text) return ""
  const pattern = new RegExp(`^[${PUNCTUATION_CLASS}\\s]+|[${PUNCTUATION_CLASS}\\s]+$`, "g")
  return text.replace(pattern, "")
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function findAliasMatches(segment, aliasEntries) {
  const matches = []
  const source = segment.trim()
  if (!source) return matches

  aliasEntries.forEach((entry) => {
    const variants = [entry.alias, `${entry.alias}ም`, `${entry.alias}ን`, `${entry.alias}ንም`]
    variants.forEach((variant) => {
      const pattern = new RegExp(
        `(^|\\s|[${PUNCTUATION_CLASS}])(${escapeRegExp(variant)})(?=\\s|$|[${PUNCTUATION_CLASS}])`,
        "g",
      )
      let match
      while ((match = pattern.exec(source))) {
        const text = match[2]
        const suffix = text.endsWith("ንም")
          ? "ንም"
          : text.endsWith("ም")
            ? "ም"
            : text.endsWith("ን")
              ? "ን"
              : ""
        matches.push({
          speaker: entry.name,
          alias: entry.alias,
          matchedText: text,
          suffix,
          index: match.index + match[1].length,
          end: match.index + match[1].length + text.length,
        })
      }
    })
  })

  return matches.sort((a, b) => a.index - b.index)
}

function findLastToken(segment) {
  const tokens = segment.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const raw = tokens[tokens.length - 1]
  const clean = stripEdgePunctuation(raw)
  return { raw, clean }
}

function getWordIndexAt(text, charIndex) {
  if (charIndex <= 0) return 0
  return text.slice(0, charIndex).trim().split(/\s+/).filter(Boolean).length - 1
}

function findAnySpeakerInText(text, aliasEntries) {
  const matches = findAliasMatches(text, aliasEntries)
  if (matches.length === 0) return null
  return matches[matches.length - 1].speaker
}

function resolveEndingVerbSegment(segment, aliasEntries, fallbackSpeaker) {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null

  const lastToken = tokens[tokens.length - 1]
  const lastClean = stripEdgePunctuation(lastToken)
  if (!ENDING_VERB_SET.has(lastClean)) return null

  const matches = findAliasMatches(trimmed, aliasEntries)
  const verbTokenIndex = tokens.length - 1
  const nearMatch = [...matches].reverse().find((match) => {
    const tokenIndex = getWordIndexAt(trimmed, match.index)
    return tokenIndex >= verbTokenIndex - 2
  })

  if (nearMatch) {
    return {
      mode: "after",
      speaker: nearMatch.speaker,
      listener: null,
    }
  }

  return {
    mode: "before",
    speaker: findAnySpeakerInText(trimmed, aliasEntries) ?? fallbackSpeaker ?? null,
    listener: null,
  }
}

function resolveSpeakerFromSegment(segment, aliasEntries) {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const matches = findAliasMatches(trimmed, aliasEntries)
  if (matches.length === 0) return null

  const lastMatch = matches[matches.length - 1]

  // Rule 3: speaker+ም and listener+ን appear together before the punctuation.
  if (matches.length >= 2) {
    const second = matches[matches.length - 1]
    const first = matches[matches.length - 2]
    if (first.suffix === "ም" && second.suffix === "ን" && second.end === trimmed.length) {
      return { speaker: first.speaker, listener: second.speaker }
    }
  }

  // Rule 1/2: name or name+ም immediately before ።
  if (lastMatch.end === trimmed.length && lastMatch.suffix !== "ን") {
    return { speaker: lastMatch.speaker, listener: null }
  }

  // Rule 4: speech verb right before ።, find name earlier in the segment.
  const lastToken = findLastToken(trimmed)
  if (lastToken && SPEECH_VERB_SET.has(lastToken.clean)) {
    const verbIndex = trimmed.lastIndexOf(lastToken.raw)
    const priorMatch = [...matches]
      .reverse()
      .find((match) => match.end <= verbIndex && match.suffix !== "ን")
    if (priorMatch) {
      return { speaker: priorMatch.speaker, listener: null }
    }
  }

  return null
}

function buildQuoteFromParts(parts, startIndex) {
  const base = parts[startIndex]?.trim() ?? ""
  if (!base) return ""

  let quote = base
  let usedParts = 1

  if (quote.includes(QUESTION_MARK)) {
    const firstIndex = quote.indexOf(QUESTION_MARK)
    const wordsToFirst = countWords(quote.slice(0, firstIndex))

    if (wordsToFirst <= 4) {
      const secondIndex = quote.indexOf(QUESTION_MARK, firstIndex + 1)
      if (secondIndex !== -1) {
        quote = quote.slice(0, secondIndex + 1).trim()
      } else {
        const nextPart = parts[startIndex + usedParts]?.trim()
        if (nextPart) {
          const nextQuestion = nextPart.indexOf(QUESTION_MARK)
          if (nextQuestion !== -1) {
            quote = `${quote} ${FULL_STOP} ${nextPart.slice(0, nextQuestion + 1).trim()}`
            usedParts += 1
          } else {
            quote = `${quote} ${FULL_STOP} ${nextPart}`
            usedParts += 1
          }
        }
      }
    }
  }

  if (countWords(quote) <= 2) {
    const nextPart = parts[startIndex + usedParts]?.trim()
    if (nextPart) {
      quote = `${quote} ${FULL_STOP} ${nextPart}`
    }
  }

  return quote
}

export function extractSpeakerQuotesFromVerse(verseText, bookId, options = {}) {
  if (!verseText) return []
  const aliasEntries = getAliasesForBook(bookId)
  const parts = verseText.split(FULL_STOP)
  const results = []

  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index]?.trim()
    if (!segment) continue

    const endingVerbInfo = resolveEndingVerbSegment(segment, aliasEntries, options.fallbackSpeaker)
    if (endingVerbInfo) {
      if (!endingVerbInfo.speaker) continue
      const quote =
        endingVerbInfo.mode === "before"
          ? `${segment.trim()}${FULL_STOP}`
          : buildQuoteFromParts(parts, index + 1)
      if (!quote) continue
      results.push({
        speaker: endingVerbInfo.speaker,
        listener: endingVerbInfo.listener ?? null,
        quote,
      })
      continue
    }

    const speakerInfo = resolveSpeakerFromSegment(segment, aliasEntries)
    if (!speakerInfo?.speaker) continue

    const quote = buildQuoteFromParts(parts, index + 1)
    if (!quote) continue

    results.push({
      speaker: speakerInfo.speaker,
      listener: speakerInfo.listener ?? null,
      quote,
    })
  }

  return results
}

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export async function collectSpeakerQuotes({ sourceScope, sourceBookId, maxQuotes = 10 }) {
  const allBooks = getAllBooks()
  let candidateBooks = allBooks.filter((book) => NARRATIVE_SPEECH_BOOKS.includes(book.id))

  if (sourceScope === "ot") {
    candidateBooks = candidateBooks.filter((book) => book.testament === "ot")
  } else if (sourceScope === "nt") {
    candidateBooks = candidateBooks.filter((book) => book.testament === "nt")
  } else if (sourceScope === "single") {
    candidateBooks = candidateBooks.filter((book) => book.id === sourceBookId)
  }

  const results = []
  const shuffledBooks = shuffle(candidateBooks)
  const maxVersesPerBook = 350

  for (const book of shuffledBooks) {
    if (results.length >= maxQuotes) break

    const payload = await loadBookById(book.id)
    let scanned = 0

    for (const chapter of payload.chapters ?? []) {
      if (results.length >= maxQuotes) break
      if (!Array.isArray(chapter.verses)) continue

      let lastSpeaker = null

      for (let verseIndex = 0; verseIndex < chapter.verses.length; verseIndex += 1) {
        if (results.length >= maxQuotes) break
        if (scanned >= maxVersesPerBook) break

        const text = chapter.verses[verseIndex]
        scanned += 1
        if (!text) continue

        const aliasEntries = getAliasesForBook(book.id)
        const verseSpeaker = findAnySpeakerInText(text, aliasEntries)
        if (verseSpeaker) {
          lastSpeaker = verseSpeaker
        }

        const quotes = extractSpeakerQuotesFromVerse(text, book.id, { fallbackSpeaker: lastSpeaker })
        quotes.forEach((quote) => {
          if (results.length >= maxQuotes) return
          results.push({
            ...quote,
            bookId: book.id,
            bookName: book.nameAm,
            chapter: chapter.chapter,
            verseNumber: verseIndex + 1,
          })
        })
      }
    }
  }

  return results
}
