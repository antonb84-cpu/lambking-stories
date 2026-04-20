/**
 * Derive a 2-letter lowercase prefix from a series name.
 * Rules:
 *  - Split on whitespace and non-alpha separators.
 *  - If 2+ words: take the first letter of the first two words.
 *  - If 1 word: take its first two letters.
 *  - Falls back to padding with 'x' if there are fewer than 2 usable letters.
 */
export function derivePrefix(name: string): string {
  const words = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean)

  let prefix = ''
  if (words.length >= 2) {
    prefix = (words[0]!.charAt(0) + words[1]!.charAt(0))
  } else if (words.length === 1) {
    prefix = words[0]!.slice(0, 2)
  }
  while (prefix.length < 2) prefix += 'x'
  return prefix.slice(0, 2)
}

/**
 * Given a base prefix and a set of taken prefixes, return up to N alternative 2-letter prefixes.
 */
export function suggestAlternatives(base: string, taken: Set<string>, count = 5): string[] {
  const out: string[] = []
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const first = base.charAt(0)
  for (const c of alphabet) {
    const candidate = first + c
    if (candidate !== base && !taken.has(candidate)) {
      out.push(candidate)
      if (out.length === count) return out
    }
  }
  for (const a of alphabet) {
    for (const b of alphabet) {
      const candidate = a + b
      if (candidate !== base && !taken.has(candidate)) {
        out.push(candidate)
        if (out.length === count) return out
      }
    }
  }
  return out
}
