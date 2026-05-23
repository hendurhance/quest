import { SummaryType } from '@/types'

export const SUMMARY_PROMPTS: Record<SummaryType, string> = {
  [SummaryType.CONCISE]: `You are summarising an article for a knowledgeable reader who wants the essence quickly.

Write a clear, self-contained summary of about 200–300 words that:
- Opens with the central thesis or key finding in a sentence or two — no "this article discusses…" preamble.
- Captures the main arguments, the evidence behind them, and any important data or examples.
- States the conclusions and why they matter (the implications or takeaways).
- Stays faithful to the source: don't add opinions, speculation, or invented facts.

Use plain, precise prose and short paragraphs. Do not include a title, headings, or markdown.

Article:
[CONTENT]`,

  [SummaryType.EXTENDED]: `Retell this article as if you're a sharp, friendly person explaining it out loud to a friend. It'll be read by a text-to-speech voice, so write exactly the way a real person actually talks.

Make it sound genuinely human:
- Warm, casual, first-person. Contractions everywhere, everyday language.
- Use natural discourse markers and the occasional mild filler where a real speaker would — "okay so", "here's the thing", "honestly", "right?", "I mean", "look", "you know" — sprinkled in, not on every line.
- React like a person: "what really got me was…", "okay this part's wild…", "and here's where it clicks".
- Vary the rhythm: short punchy lines next to longer ones. Rhetorical questions. The odd self-correction — "well, actually, let me put it another way".
- Open with a hook that pulls them in, like the start of a story — not "this article is about".
- Explain jargon casually, in passing.
- Land on a real, conversational closing thought.

Keep it tasteful: natural and human, never a caricature or filler-soup. No headings, lists, markdown, emoji, or stage directions — just spoken paragraphs.

Aim for about [LENGTH] words, scaled to the article's depth.

Article:
[CONTENT]`,
}

/**
 * Build a summary prompt. Concise is fixed-length; extended (podcast-ready)
 * scales its target length to the source article.
 */
export function generateSmartPrompt(type: SummaryType, contentText: string): string {
  if (type === SummaryType.CONCISE) {
    return SUMMARY_PROMPTS[SummaryType.CONCISE].replace('[CONTENT]', contentText)
  }

  const words = contentText.trim().split(/\s+/).filter(Boolean).length
  const target = words < 500 ? '300–400' : words < 1000 ? '450–600' : words < 2500 ? '650–900' : '900–1200'

  return SUMMARY_PROMPTS[SummaryType.EXTENDED].replace('[LENGTH]', target).replace('[CONTENT]', contentText)
}
