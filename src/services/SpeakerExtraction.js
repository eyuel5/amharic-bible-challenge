import { BIBLE_FIGURES } from "../data/bible/bibleFigures.js"

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
const GROUP_ENDING_VERBS = new Set(["አሉ", "ተናገሩ", "መለሱ", "መለሱለት"])
const PUNCTUATION_CLASS = PUNCTUATIONS.map((char) => `\\${char}`).join("")

const EXTRA_SPEAKER_ENTRIES = [
  {
    id: "the_lord",
    name: "እግዚአብሔር",
    aliases: ["እግዚአብሔር"],
    books: [],
    tags: ["speaker"],
  },
]

const figureById = new Map(
  [...BIBLE_FIGURES, ...EXTRA_SPEAKER_ENTRIES].map((figure) => [figure.id, figure]),
)
const figureByName = new Map(
  [...BIBLE_FIGURES, ...EXTRA_SPEAKER_ENTRIES].map((figure) => [figure.name, figure]),
)
const JESUS_NAME = figureById.get("jesus")?.name ?? "ኢየሱስ"

const figureAliasIndex = [...BIBLE_FIGURES, ...EXTRA_SPEAKER_ENTRIES].flatMap((figure) => {
  const aliases = Array.isArray(figure.aliases) && figure.aliases.length > 0 ? figure.aliases : [figure.name]
  return aliases.map((alias) => ({
    id: figure.id,
    name: figure.name,
    alias,
    books: figure.books ?? [],
    tags: figure.tags ?? [],
  }))
})

const aliasToIds = figureAliasIndex.reduce((map, entry) => {
  const existing = map.get(entry.alias) ?? new Set()
  existing.add(entry.id)
  map.set(entry.alias, existing)
  return map
}, new Map())

const aliasesByBookId = new Map()
const GOSPEL_BOOKS = new Set(["mat", "mrk", "luk", "jhn"])
const APOSTLE_TAGS = new Set(["apostle", "disciple"])

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

function hasIntroPronoun(text) {
  const tokens = text.split(/\s+/).map((token) => stripEdgePunctuation(token))
  return tokens.some((token) => INTRO_PRONOUNS.includes(token))
}

function hasToken(text, target) {
  if (!text || !target) return false
  const tokens = text.split(/\s+/).map((token) => stripEdgePunctuation(token))
  return tokens.includes(target)
}

function isFigureTaggedByName(name, tagSet) {
  if (!name) return false
  const figure = figureByName.get(name)
  if (!figure || !Array.isArray(figure.tags)) return false
  return figure.tags.some((tag) => tagSet.has(tag))
}

function hasTaggedMention(text, aliasEntries, bookId, tagSet) {
  const matches = findAliasMatches(text, aliasEntries, bookId)
  return matches.some((match) => {
    const entry = figureById.get(match.id)
    if (!entry || !Array.isArray(entry.tags)) return false
    return entry.tags.some((tag) => tagSet.has(tag))
  })
}

function endsWithIntroPronounSegment(segment) {
  const cleaned = segment.trim()
  if (!cleaned) return false
  const tokens = cleaned.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  const lastToken = stripEdgePunctuation(tokens[tokens.length - 1])
  return INTRO_PRONOUNS.includes(lastToken)
}

function startsWithIntroPronounSegment(segment) {
  const cleaned = segment.trim()
  if (!cleaned) return false
  const tokens = cleaned.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  const firstToken = stripEdgePunctuation(tokens[0])
  return INTRO_PRONOUNS.includes(firstToken)
}

function isAliasAllowed(entry, bookId) {
  const ids = aliasToIds.get(entry.alias)
  if (!ids || ids.size <= 1) return true

  if (bookId) {
    const idsInBook = new Set(
      figureAliasIndex
        .filter((candidate) => candidate.alias === entry.alias && candidate.books?.includes(bookId))
        .map((candidate) => candidate.id),
    )
    if (idsInBook.size === 1) return true
  }

  return false
}

function isGroupFigure(id) {
  return figureById.get(id)?.tags?.includes("group")
}

function findAliasMatches(segment, aliasEntries, bookId, options = {}) {
  const matches = []
  const source = segment.trim()
  if (!source) return matches
  const requireGroup = Boolean(options.requireGroup)

  aliasEntries.forEach((entry) => {
    if (!isAliasAllowed(entry, bookId)) return
    if (requireGroup && !isGroupFigure(entry.id)) return
    const variants = [
      entry.alias,
      `${entry.alias}ም`,
      `${entry.alias}ን`,
      `${entry.alias}ንም`,
      `${entry.alias}ና`,
      `${entry.alias}ናም`,
    ]
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
              : text.endsWith("ናም")
                ? "ናም"
                : text.endsWith("ና")
                  ? "ና"
              : ""
        matches.push({
          id: entry.id,
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

function findPrimarySpeakerInText(text, aliasEntries, bookId, options = {}) {
  const matches = findAliasMatches(text, aliasEntries, bookId, options)
  if (matches.length === 0) return null
  return matches[0].speaker
}

function findListenerFromSegment(segment, aliasEntries, bookId, options = {}) {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const requireGroup = Boolean(options.requireGroup)
  const matches = findAliasMatches(trimmed, aliasEntries, bookId, { requireGroup })
  if (matches.length === 0) return null

  const listenerMatch = [...matches]
    .reverse()
    .find((match) => match.suffix === "ን" || match.suffix === "ንም")

  return listenerMatch ? listenerMatch.speaker : null
}

function findPriorListener(parts, startIndex, aliasEntries, bookId, options = {}) {
  for (let i = startIndex; i >= 0; i -= 1) {
    const segment = parts[i]?.trim()
    if (!segment) continue
    const listener = findListenerFromSegment(segment, aliasEntries, bookId, options)
    if (listener) return listener
  }
  return null
}

function resolveEndingVerbSegment(
  segment,
  aliasEntries,
  bookId,
  fallbackSpeaker,
  fallbackGroupSpeaker,
  fallbackAltSpeaker,
  fallbackAltGroupSpeaker,
) {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null

  const lastToken = tokens[tokens.length - 1]
  const lastClean = stripEdgePunctuation(lastToken)
  if (!ENDING_VERB_SET.has(lastClean)) return null

  const isGroupVerb = GROUP_ENDING_VERBS.has(lastClean)
  const matches = findAliasMatches(trimmed, aliasEntries, bookId, { requireGroup: isGroupVerb })
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

  const speechAfterMarker = /\b(እንዲህ|እንዲሁ|እንዲህም|እንዲሁም)\b/u.test(trimmed)
  const speechIntroMarker = /\b(ብሎ|ብለው|ብላ|ብለች|ይላል|ትላለች|ይላሉ|ትላሉ)\b/u.test(trimmed)
  const introPronounMarker = hasIntroPronoun(trimmed)

  if (speechAfterMarker) {
    const inferredSpeaker = findPrimarySpeakerInText(trimmed, aliasEntries, bookId, { requireGroup: isGroupVerb })
    const fallback = isGroupVerb ? fallbackGroupSpeaker : fallbackSpeaker
    return {
      mode: "after",
      speaker: inferredSpeaker ?? fallback ?? null,
      listener: null,
    }
  }

  if (introPronounMarker) {
    const inferredSpeaker = findPrimarySpeakerInText(trimmed, aliasEntries, bookId, { requireGroup: isGroupVerb })
    const fallback =
      isGroupVerb
        ? fallbackAltGroupSpeaker ?? fallbackGroupSpeaker
        : fallbackAltSpeaker ?? fallbackSpeaker
    return {
      mode: "after",
      speaker: inferredSpeaker ?? fallback ?? null,
      listener: null,
    }
  }

  if (!speechIntroMarker && !introPronounMarker) {
    return null
  }

  return {
    mode: "before",
    speaker:
      findPrimarySpeakerInText(trimmed, aliasEntries, bookId, { requireGroup: isGroupVerb }) ??
      (isGroupVerb ? fallbackGroupSpeaker : fallbackSpeaker) ??
      null,
    listener: null,
  }
}

function resolveSpeakerFromSegment(segment, aliasEntries, bookId) {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const matches = findAliasMatches(trimmed, aliasEntries, bookId)
  if (matches.length === 0) return null

  const lastMatch = matches[matches.length - 1]

  // Rule 3: speaker+ም and listener+ን appear together before the punctuation.
  if (matches.length >= 2) {
    const second = matches[matches.length - 1]
    const first = matches[matches.length - 2]
    if (first.suffix === "ም" && (second.suffix === "ን" || second.suffix === "ንም") && second.end === trimmed.length) {
      return { speaker: first.speaker, listener: second.speaker }
    }
  }

  // Rule 1/2: name or name+ም immediately before ።
  if (lastMatch.end === trimmed.length && lastMatch.suffix !== "ን" && lastMatch.suffix !== "ንም") {
    return { speaker: lastMatch.speaker, listener: null }
  }

  // Rule 4: speech verb right before ።, find name earlier in the segment.
  const lastToken = findLastToken(trimmed)
  if (lastToken && SPEECH_VERB_SET.has(lastToken.clean)) {
    const verbIndex = trimmed.lastIndexOf(lastToken.raw)
    const priorMatch = [...matches]
      .reverse()
      .find((match) => match.end <= verbIndex && match.suffix !== "ን" && match.suffix !== "ንም")
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
          if (startsWithIntroPronounSegment(nextPart)) {
            return quote
          }
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
      if (startsWithIntroPronounSegment(nextPart)) {
        return quote
      }
      quote = `${quote} ${FULL_STOP} ${nextPart}`
    }
  }

  if (countWords(quote) <= 4) {
    const remaining = parts.slice(startIndex + usedParts).join(FULL_STOP)
    if (remaining) {
      if (startsWithIntroPronounSegment(remaining)) {
        return quote
      }
      const extra = buildQuoteUntilPunctuation(remaining, 0)
      if (extra) {
        quote = `${quote} ${FULL_STOP} ${extra}`
      }
    }
  }

  return quote
}

function buildQuoteUntilPunctuation(text, startIndex) {
  if (!text) return ""
  const remaining = text.slice(startIndex).trim()
  if (!remaining) return ""

  const questionIndex = remaining.indexOf(QUESTION_MARK)
  const fullStopIndex = remaining.indexOf(FULL_STOP)

  let cutIndex = -1
  if (questionIndex !== -1 && fullStopIndex !== -1) {
    cutIndex = Math.min(questionIndex, fullStopIndex)
  } else if (questionIndex !== -1) {
    cutIndex = questionIndex
  } else if (fullStopIndex !== -1) {
    cutIndex = fullStopIndex
  }

  if (cutIndex === -1) return remaining
  return remaining.slice(0, cutIndex + 1).trim()
}

export function extractSpeakerQuotesFromVerse(verseText, bookId, options = {}) {
  if (!verseText) return []
  const aliasEntries = getAliasesForBook(bookId)
  const trimmedVerse = verseText.trim()
  const endsWithTerminal = trimmedVerse.endsWith(FULL_STOP) || trimmedVerse.endsWith(QUESTION_MARK)
  const parts = verseText.split(FULL_STOP)
  if (options.continuationText && !endsWithTerminal) {
    parts.push(options.continuationText)
  }
  const results = []
  const candidates = []

  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index]?.trim()
    if (!segment) continue

    if (endsWithIntroPronounSegment(segment)) {
      const priorGroupListener =
        index > 0 ? findPriorListener(parts, index - 1, aliasEntries, bookId, { requireGroup: true }) : null
      const priorListener = index > 0 ? findPriorListener(parts, index - 1, aliasEntries, bookId) : null
      const remaining = parts.slice(index + 1).join(FULL_STOP)
      const quote = buildQuoteUntilPunctuation(remaining, 0)
      if (quote) {
        let speaker =
          priorGroupListener ??
          priorListener ??
          (index > 0 ? options.fallbackAltSpeaker ?? options.fallbackSpeaker : options.fallbackSpeaker)

        const priorText = options.priorVerseText ?? ""
        const priorSaidToHim = hasToken(priorText, "አሉት")
        if (priorSaidToHim && options.fallbackSpeaker && (!speaker || speaker === options.fallbackAltSpeaker)) {
          speaker = options.fallbackSpeaker
        }
        const shouldPreferJesus =
          GOSPEL_BOOKS.has(bookId) &&
          hasToken(priorText, "አሉት") &&
          hasTaggedMention(priorText, aliasEntries, bookId, APOSTLE_TAGS) &&
          hasToken(verseText, "አላቸው")

        if (shouldPreferJesus && (!speaker || isFigureTaggedByName(speaker, APOSTLE_TAGS))) {
          speaker = JESUS_NAME
        }

        candidates.push({
          speaker: speaker ?? null,
          listener: null,
          quote,
          rank: 3,
          order: index,
        })
      }
    }

    const endingVerbInfo = resolveEndingVerbSegment(
      segment,
      aliasEntries,
      bookId,
      options.fallbackSpeaker,
      options.fallbackGroupSpeaker,
      options.fallbackAltSpeaker,
      options.fallbackAltGroupSpeaker,
    )
    if (endingVerbInfo) {
      if (!endingVerbInfo.speaker) continue
      const quote =
        endingVerbInfo.mode === "before"
          ? `${segment.trim()}${FULL_STOP}`
          : buildQuoteFromParts(parts, index + 1)
      if (!quote) continue
      candidates.push({
        speaker: endingVerbInfo.speaker,
        listener: endingVerbInfo.listener ?? null,
        quote,
        rank: endingVerbInfo.mode === "before" ? 1 : 2,
        order: index,
      })
      continue
    }

    const speakerInfo = resolveSpeakerFromSegment(segment, aliasEntries, bookId)
    if (!speakerInfo?.speaker) continue

    const quote = buildQuoteFromParts(parts, index + 1)
    if (!quote) continue

    candidates.push({
      speaker: speakerInfo.speaker,
      listener: speakerInfo.listener ?? null,
      quote,
      rank: 4,
      order: index,
    })
  }

  if (candidates.length === 0) return []

  const earliestOrder = Math.min(...candidates.map((item) => item.order))
  const earliestCandidates = candidates.filter((item) => item.order === earliestOrder)

  earliestCandidates.sort((a, b) => b.rank - a.rank)
  const topRank = earliestCandidates[0].rank
  return earliestCandidates.filter((item) => item.rank === topRank)
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
  const { getAllBooks, loadBookById } = await import("./bibleService.js")
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
  const maxPerBook = Math.max(4, Math.ceil(maxQuotes / 3))
  const countsByBook = new Map()

  for (const book of shuffledBooks) {
    if (results.length >= maxQuotes) break

    const payload = await loadBookById(book.id)
    let scanned = 0

    for (const chapter of payload.chapters ?? []) {
      if (results.length >= maxQuotes) break
      if (!Array.isArray(chapter.verses)) continue

        let lastSpeaker = null
        let lastAltSpeaker = null
        let lastGroupSpeaker = null
        let lastAltGroupSpeaker = null

      for (let verseIndex = 0; verseIndex < chapter.verses.length; verseIndex += 1) {
        if (results.length >= maxQuotes) break
        if (scanned >= maxVersesPerBook) break

        const text = chapter.verses[verseIndex]
        scanned += 1
        if (!text) continue

        const aliasEntries = getAliasesForBook(book.id)
        const verseSpeaker = findPrimarySpeakerInText(text, aliasEntries, book.id)
        if (verseSpeaker) {
          if (lastSpeaker && verseSpeaker !== lastSpeaker) {
            lastAltSpeaker = lastSpeaker
          }
          lastSpeaker = verseSpeaker
        }
        const verseGroupSpeaker = findPrimarySpeakerInText(text, aliasEntries, book.id, { requireGroup: true })
        if (verseGroupSpeaker) {
          if (lastGroupSpeaker && verseGroupSpeaker !== lastGroupSpeaker) {
            lastAltGroupSpeaker = lastGroupSpeaker
          }
          lastGroupSpeaker = verseGroupSpeaker
        }

        const nextVerseText = chapter.verses[verseIndex + 1]
        const priorVerseText = chapter.verses[verseIndex - 1]
        const quotes = extractSpeakerQuotesFromVerse(text, book.id, {
          fallbackSpeaker: lastSpeaker,
          fallbackAltSpeaker: lastAltSpeaker,
          fallbackGroupSpeaker: lastGroupSpeaker,
          fallbackAltGroupSpeaker: lastAltGroupSpeaker,
          continuationText: nextVerseText ?? "",
          priorVerseText: priorVerseText ?? "",
        })
        quotes.forEach((quote) => {
          if (results.length >= maxQuotes) return
          const currentCount = countsByBook.get(book.id) ?? 0
          if (currentCount >= maxPerBook && shuffledBooks.length > 1) return
          results.push({
            ...quote,
            bookId: book.id,
            bookName: book.nameAm,
            chapter: chapter.chapter,
            verseNumber: verseIndex + 1,
          })
          countsByBook.set(book.id, currentCount + 1)
        })
      }
    }
  }

  return shuffle(results)
}
