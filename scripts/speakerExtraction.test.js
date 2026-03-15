import assert from "node:assert/strict"
import { extractSpeakerQuotesFromVerse } from "../src/services/SpeakerExtraction.js"

const verseText =
  "የዚያን ጊዜም ንጉሡ ናቡከደነፆር ተደነቀ ፈጥኖም ተነሣ፤ አማካሪዎቹንም። ሦስት ሰዎች አስረን በእሳት ውስጥ ጥለን አልነበረምን? ብሎ ተናገራቸው። እነርሱም። ንጉሥ ሆይ፥ እውነት ነው ብለው ለንጉሡ መለሱለት።"

const quotes = extractSpeakerQuotesFromVerse(verseText, "dan")

assert.ok(quotes.length > 0, "Expected at least one quote")
assert.ok(
  quotes.some((item) => item.speaker === "አማካሪዎቹ"),
  "Expected speaker to be አማካሪዎቹ",
)
assert.ok(
  quotes.some((item) => item.quote.includes("ንጉሥ ሆይ")),
  "Expected quote to include the response to the king",
)

const markPrevVerse = "ስምዖንና ከእርሱ ጋር የነበሩትም ገሥግሠው ተከተሉት፥ ባገኙትም ጊዜ። ሁሉ ይፈልጉሃል አሉት።"
const markVerse =
  "እርሱም። በዚያ ደግሞ ልሰብክ ወደ ሌላ ስፍራ በቅርብ ወዳሉ መንደሮች እንሂድ ስለዚህ ወጥቻለሁና አላቸው።"

const markQuotes = extractSpeakerQuotesFromVerse(markVerse, "mrk", {
  priorVerseText: markPrevVerse,
})

assert.ok(markQuotes.length > 0, "Expected at least one Mark 1:37 quote")
assert.ok(
  markQuotes.some((item) => item.speaker === "ኢየሱስ"),
  "Expected speaker to be ኢየሱስ",
)

const jonahPrevVerse =
  "ባሕሩንም ሞገዱ አጥብቆ ያናውጠው ነበርና። ባሕሩ ከእኛ ዘንድ ጸጥ እንዲል ምን እናድርግብህ? አሉት።"
const jonahVerse =
  "እርሱም። ይህ ታላቅ ማዕበል በእኔ ምክንያት እንዳገኛችሁ አውቃለሁና አንሥታችሁ ወደ ባሕር ጣሉኝ፥ ባሕሩም ጸጥ ይልላችኋል አላቸው።"
const jonahQuotes = extractSpeakerQuotesFromVerse(jonahVerse, "jon", {
  priorVerseText: jonahPrevVerse,
  fallbackSpeaker: "ዮናስ",
  fallbackAltSpeaker: "የመርከቡ አለቃ",
})
assert.ok(jonahQuotes.length > 0, "Expected at least one Jonah 1:12 quote")
assert.ok(
  jonahQuotes.some((item) => item.speaker === "ዮናስ"),
  "Expected speaker to be ዮናስ",
)

console.log("speakerExtraction.test.js passed")
