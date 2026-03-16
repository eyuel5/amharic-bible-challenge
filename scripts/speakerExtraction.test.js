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

const mrkUncleanPrev =
  "በዚያን ጊዜም በምኩራባቸው ርኵስ መንፈስ ያለው ሰው ነበረ፤"
const mrkUncleanVerse =
  "እርሱም። የናዝሬቱ ኢየሱስ ሆይ፥ ከአንተ ጋር ምን አለን? ልታጠፋን መጣህን? ማን እንደ ሆንህ አውቄአለሁ፥ የእግዚአብሔር ቅዱሱ ብሎ ጮኸ።"
const mrkUncleanQuotes = extractSpeakerQuotesFromVerse(mrkUncleanVerse, "mrk", {
  priorVerseText: mrkUncleanPrev,
})
assert.ok(mrkUncleanQuotes.length > 0, "Expected at least one Mark 1:23 quote")
assert.ok(
  mrkUncleanQuotes.some((item) => item.speaker === "ርኵስ መንፈስ"),
  "Expected speaker to be ርኵስ መንፈስ",
)

const genPrevVerse = "እግዚአብሔር አምላክም አዳምን ጠርቶ። ወዴት ነህ? አለው።"
const genVerse =
  "እርሱም አለ። በገነት ድምፅህን ሰማሁ፤ ዕራቁቴንም ስለ ሆንሁ ፈራሁ፥ ተሸሸግሁም።"
const genQuotes = extractSpeakerQuotesFromVerse(genVerse, "gen", { priorVerseText: genPrevVerse })
assert.ok(genQuotes.length > 0, "Expected at least one Gen 3:10 quote")
assert.ok(
  genQuotes.some((item) => item.speaker === "አዳም"),
  "Expected speaker to be አዳም",
)

const mrkSabbathPrev =
  "ፈሪሳውያንም። እነሆ፥ በሰንበት ያልተፈቀደውን ስለ ምን ያደርጋሉ? አሉት።"
const mrkSabbathVerse =
  "እርሱም። ዳዊት ባስፈለገውና በተራበ ጊዜ፥ እርሱ አብረውት ከነበሩት ጋር ያደረገውን፥ አብያተር ሊቀ ካህናት በነበረ ጊዜ ወደ እግዚአብሔር ቤት እንደ ገባ፥"
const mrkSabbathNext =
  "ከካህናት በቀር መብላት ያልተፈቀደውን የመሥዋዕትን እንጀራ እንደ በላ፥ ከእርሱም ጋር ለነበሩት እንደ ሰጣቸው ከቶ አላነበባችሁምን? አላቸው።"
const mrkSabbathQuotes = extractSpeakerQuotesFromVerse(mrkSabbathVerse, "mrk", {
  priorVerseText: mrkSabbathPrev,
  continuationText: mrkSabbathNext,
  fallbackSpeaker: "ኢየሱስ",
})
assert.ok(mrkSabbathQuotes.length > 0, "Expected at least one Mark 2:25 quote")
assert.ok(
  mrkSabbathQuotes.some((item) => item.speaker === "ኢየሱስ"),
  "Expected speaker to be ኢየሱስ",
)

const genEveVerse =
  "አዳምም ሚስቱን ሔዋንን አወቀ፤ ፀነሰችም፥ ቃየንንም ወለደች። እርስዋም። ወንድ ልጅ ከእግዚአብሔር አገኘሁ አለች።"
const genEveQuotes = extractSpeakerQuotesFromVerse(genEveVerse, "gen")
assert.ok(genEveQuotes.length > 0, "Expected at least one Gen 4:1 quote")
assert.ok(
  genEveQuotes.some((item) => item.speaker === "ሔዋን"),
  "Expected speaker to be ሔዋን",
)

const genGodQuestionVerse =
  "እግዚአብሔርም አለው። ዕራቁትህን እንደ ሆንህ ማን ነገረህ? ከእርሱ እንዳትበላ ካዘዝሁህ ዛፍ በውኑ በላህን?"
const genGodQuestionQuotes = extractSpeakerQuotesFromVerse(genGodQuestionVerse, "gen")
assert.ok(genGodQuestionQuotes.length > 0, "Expected at least one Gen 3:11 quote")
assert.ok(
  genGodQuestionQuotes.some((item) => item.speaker === "እግዚአብሔር"),
  "Expected speaker to be እግዚአብሔር",
)

const genGodCainVerse =
  "እግዚአብሔርም ቃየንን አለው። ወንድምህ አቤል ወዴት ነው? እርሱም አለ። አላውቅም፤ የወንድሜ ጠባቂው እኔ ነኝን?"
const genGodCainQuotes = extractSpeakerQuotesFromVerse(genGodCainVerse, "gen")
assert.ok(genGodCainQuotes.length > 0, "Expected at least one Gen 4:9 quote")
assert.ok(
  genGodCainQuotes.some((item) => item.speaker === "እግዚአብሔር"),
  "Expected speaker to be እግዚአብሔር",
)
assert.ok(
  genGodCainQuotes.every((item) => !item.quote.includes("እርሱም አለ")),
  "Expected quote not to include Cain's reply",
)

const mrkPhariseeVerse =
  "ፈሪሳውያንም። እነሆ፥ በሰንበት ያልተፈቀደውን ስለ ምን ያደርጋሉ? አሉት።"
const mrkPhariseeQuotes = extractSpeakerQuotesFromVerse(mrkPhariseeVerse, "mrk")
assert.ok(mrkPhariseeQuotes.length > 0, "Expected at least one Mark 2:24 quote")
assert.ok(
  mrkPhariseeQuotes.some((item) => item.speaker === "ፈሪሳውያን"),
  "Expected speaker to be ፈሪሳውያን",
)

console.log("speakerExtraction.test.js passed")
