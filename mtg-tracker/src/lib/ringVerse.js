// The Ring verse in Black Speech, written in Tengwar ("Ash nazg durbatulûk, ash nazg gimbatul,
// ash nazg thrakatulûk, agh burzum-ishi krimpatul"). Taken from the sample texts of the
// Alcarin Tengwar font by Toshi Omagari (OFL), the same typeface used on The One Ring card.
// The characters are Tengwar letters in the Unicode private use area; they only show with that font.
export const RING_VERSE = [
  "\ue01a\ue040 \ue010\ue027\ue040\ue007 \ue004\ue014\ue04a\ue005\ue000\ue040\ue022\ue04a\ue003\ue04a\ue04a",
  "\ue01a\ue040 \ue010\ue027\ue040\ue007 \ue007\ue005\ue04f\ue044\ue000\ue040\ue022\ue04a",
  "\ue01a\ue040 \ue010\ue027\ue040\ue007 \ue008\ue020\ue003\ue040\ue000\ue040\ue022\ue04a\ue003\ue04a\ue04a",
  "\ue01f\ue040 \ue005\ue014\ue04a\ue026\ue011\ue04a\ue01a\ue044\ue02e\ue044 \ue003\ue020\ue001\ue04f\ue044\ue000\ue040\ue022\ue040",
]

// The whole verse as one line, with a Tengwar separator between the lines.
export const RING_LINE = RING_VERSE.join(' ⸱ ')
