import { sendMessage } from '@/core/messaging/bus'
import { markdownToHtml } from '@/core/markdown'

interface ExtractedContent {
  title: string
  content: string
  author?: string
  publishDate?: string
  wordCount: number
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ ready: true })
    return true
  }
  if (message.action === 'getWordCount') {
    sendResponse({ wordCount: calculateWordCount() })
    return true
  }
  if (message.action === 'extractContent') {
    sendResponse({ content: ContentExtractor.extractContent() })
    return true
  }
  return false
})

function calculateWordCount(): number {
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.story-body',
    '.post-body',
    'main',
  ]

  let mainContent: HTMLElement | null = null
  for (const selector of contentSelectors) {
    mainContent = document.querySelector(selector)
    if (mainContent) break
  }
  if (!mainContent) mainContent = document.body

  const clone = mainContent.cloneNode(true) as HTMLElement
  const unwanted = ['script', 'style', 'nav', 'header', 'footer', '.ad', '.advertisement', '.sidebar', '.comments', '.share', '.social', '.navigation', '.menu']
  unwanted.forEach((selector) => clone.querySelectorAll(selector).forEach((el) => el.remove()))

  const text = clone.textContent || clone.innerText || ''
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

const ContentExtractor = {
  extractContent(): ExtractedContent {
    const MIN_BODY = 200

    // Prefer a real article body — pick the richest of the body-extracting
    // methods, but only if it's substantial. (A JSON-LD block with no
    // articleBody, or an og:description, must NOT short-circuit the rest.)
    const rich = [this.extractFromJsonLd(), this.extractFromSemanticHTML(), this.extractFromCommonSelectors()]
      .filter((c): c is ExtractedContent => !!c && (c.content?.length ?? 0) >= MIN_BODY)
      .sort((a, b) => b.content.length - a.content.length)[0]
    if (rich) return rich

    // Otherwise score the DOM for the most paragraph-dense region.
    const heuristic = this.extractFromHeuristics()
    if (heuristic.content.length >= MIN_BODY) return heuristic

    // Last resort: any title/description metadata we can salvage.
    return this.extractFromJsonLd() || this.extractFromOpenGraph() || this.extractFromMetaTags() || heuristic
  },

  extractFromJsonLd(): ExtractedContent | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (const script of scripts) {
      try {
        const article = this.findArticleInJsonLd(JSON.parse(script.textContent || ''))
        if (article) {
          return {
            title: article.headline || article.name || document.title,
            content: article.articleBody || article.text || '',
            author: article.author?.name || article.author,
            publishDate: article.datePublished,
            wordCount: article.wordCount || 0,
          }
        }
      } catch {
        // skip invalid JSON
      }
    }
    return null
  },

  findArticleInJsonLd(data: any): any {
    if (Array.isArray(data)) {
      for (const item of data) {
        const result = this.findArticleInJsonLd(item)
        if (result) return result
      }
    }
    if (data['@type'] === 'Article' || data['@type'] === 'NewsArticle' || data['@type'] === 'BlogPosting') {
      return data
    }
    if (data['@graph']) return this.findArticleInJsonLd(data['@graph'])
    return null
  },

  extractFromOpenGraph(): ExtractedContent | null {
    const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
    if (!title) return null
    const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content')
    return { title, content: description || '', wordCount: 0 }
  },

  extractFromMetaTags(): ExtractedContent | null {
    const title = document.querySelector('meta[name="title"]')?.getAttribute('content')
    if (!title) return null
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')
    return { title, content: description || '', wordCount: 0 }
  },

  extractFromSemanticHTML(): ExtractedContent | null {
    const article = document.querySelector('article')
    if (!article) return null

    const title = article.querySelector('h1')?.textContent || document.title
    const contentElements = article.querySelectorAll('p, h2, h3, h4, h5, h6, pre, blockquote, li')
    const content = Array.from(contentElements)
      .map((el) => el.textContent?.trim())
      .filter((text) => text && text.length > 0)
      .join('\n\n')

    if (content.length < 100) return null

    const author =
      article.querySelector('[rel="author"]')?.textContent ||
      article.querySelector('.author')?.textContent ||
      article.querySelector('[data-testid="authorName"]')?.textContent ||
      undefined
    const publishDate =
      article.querySelector('time')?.getAttribute('datetime') ||
      article.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
      undefined

    return { title, content, author, publishDate, wordCount: content.split(/\s+/).length }
  },

  extractFromCommonSelectors(): ExtractedContent | null {
    const selectors = [
      { title: 'h1', content: 'article' },
      { title: '[data-testid="storyTitle"]', content: 'article' },
      { title: '.pw-post-title', content: '.pw-post-body' },
      { title: '.post-title', content: '.post-content' },
      { title: '.entry-title', content: '.entry-content' },
      { title: '.article-title', content: '.article-content' },
      { title: '.story-headline', content: '.story-body' },
    ]

    for (const selector of selectors) {
      const titleEl = document.querySelector(selector.title)
      const contentEl = document.querySelector(selector.content)
      if (titleEl && contentEl) {
        const title = titleEl.textContent || document.title
        const paragraphs = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6')
        const content = Array.from(paragraphs)
          .map((p) => p.textContent?.trim())
          .filter((text) => text && text.length > 0)
          .join('\n\n')
        if (content.length > 100) {
          return { title, content, wordCount: content.split(/\s+/).length }
        }
      }
    }
    return null
  },

  extractFromHeuristics(): ExtractedContent {
    let bestElement: Element | null = null
    let maxScore = 0
    for (const element of document.querySelectorAll('div, article, section, main')) {
      const score = this.scoreElement(element as HTMLElement)
      if (score > maxScore) {
        maxScore = score
        bestElement = element
      }
    }
    const content = bestElement?.textContent || document.body.textContent || ''
    return { title: document.title, content, wordCount: content.split(/\s+/).length }
  },

  scoreElement(element: HTMLElement): number {
    let score = element.querySelectorAll('p').length * 25
    score += Math.min((element.textContent || '').length / 100, 50)
    const className = element.className.toLowerCase()
    if (className.includes('article') || className.includes('content') || className.includes('post')) score += 25
    if (className.includes('nav') || className.includes('sidebar') || className.includes('menu')) score -= 50
    const text = element.textContent || ''
    if (!(text.length > 100 && text.split(/\s+/).length > 20)) score -= 25
    return score
  },
}

// Revisiting a saved page re-renders your highlights and surfaces the summary.
// Highlights are re-anchored by text match (the stored block offsets describe
// our extracted copy, not this live DOM).

void initAnnotations()

async function initAnnotations(): Promise<void> {
  if (!/^https?:/.test(location.href)) return
  try {
    const data = await sendMessage({ action: 'getPageAnnotations', url: location.href })
    // Diagnostic (verbose level — hidden unless you enable it). Tells you whether
    // the content script ran and whether this URL matched a saved article.
    console.debug('[Quest] saved-page check', {
      url: location.href,
      inLibrary: !!data?.articleId,
      highlights: data?.highlights?.length ?? 0,
      summary: !!data?.summary,
    })
    if (!data || !data.articleId) return // page isn't in the library
    injectAnnotationStyles()
    let rendered = 0
    for (const h of data.highlights) {
      if (renderHighlight(h.text)) rendered++
    }
    // Some pages finish rendering after document_idle — retry once if nothing
    // anchored yet so highlights still land on slow/SPA pages.
    if (rendered === 0 && data.highlights.length > 0) {
      setTimeout(() => {
        for (const h of data.highlights) renderHighlight(h.text)
      }, 1500)
    }
    mountPanel(data.highlights.length, data.summary)
  } catch {
    // background unavailable / restricted page — ignore
  }
}

function renderHighlight(text: string): boolean {
  const needle = text.trim()
  if (needle.length < 4) return false

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'MARK') return NodeFilter.FILTER_REJECT
      if (parent.closest('#quest-panel')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let node: Node | null
  while ((node = walker.nextNode())) {
    const value = node.nodeValue ?? ''
    const idx = value.indexOf(needle)
    if (idx === -1) continue
    const range = document.createRange()
    range.setStart(node, idx)
    range.setEnd(node, idx + needle.length)
    const mark = document.createElement('mark')
    mark.className = 'quest-hl'
    try {
      range.surroundContents(mark)
      return true
    } catch {
      return false // highlight spans element boundaries — skip for now
    }
  }
  return false
}

function mountPanel(count: number, summary: string | null): void {
  if (document.getElementById('quest-panel')) return
  const panel = document.createElement('div')
  panel.id = 'quest-panel'
  const label =
    count > 0
      ? `${count} highlight${count === 1 ? '' : 's'}${summary ? ' · summary' : ''}`
      : summary
        ? 'Summary'
        : 'Saved to Quest'
  const summaryHtml = summary ? markdownToHtml(summary) : ''
  panel.innerHTML = `
    <button id="quest-pill" type="button">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3a2 2 0 0 0-2 2v16l8-5 8 5V5a2 2 0 0 0-2-2z"/></svg>
      <span>${label}</span>
    </button>
    ${summary ? `<div id="quest-body"><div id="quest-summary">${summaryHtml}</div></div>` : ''}
  `
  document.body.appendChild(panel)
  if (summary) {
    panel.querySelector('#quest-pill')?.addEventListener('click', () => panel.classList.toggle('is-open'))
  }
}

function injectAnnotationStyles(): void {
  if (document.getElementById('quest-styles')) return
  const style = document.createElement('style')
  style.id = 'quest-styles'
  style.textContent = `
    mark.quest-hl { background: rgba(240,210,123,0.5); color: inherit; border-radius: 2px; padding: 0 1px; }
    #quest-panel { position: fixed; bottom: 18px; right: 18px; z-index: 2147483646; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #quest-pill { display: inline-flex; align-items: center; gap: 7px; background: #15604f; color: #faf6ee; border: 0; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
    #quest-body { display: none; margin-top: 8px; width: 340px; max-height: 50vh; overflow-y: auto; background: #fffdf8; color: #211e1a; border: 1px solid #e3dccd; border-radius: 12px; padding: 16px 18px; box-shadow: 0 16px 48px -12px rgba(0,0,0,0.28); }
    #quest-panel.is-open #quest-body { display: block; }
    #quest-summary { font-size: 14px; line-height: 1.6; }
    #quest-summary p { margin: 0 0 10px; }
    #quest-summary strong { font-weight: 600; }
    #quest-summary em { font-style: italic; }
    #quest-summary code { font-family: ui-monospace, Menlo, monospace; font-size: 0.92em; background: #f1ebdd; padding: 1px 4px; border-radius: 3px; }
    #quest-summary ul, #quest-summary ol { margin: 0 0 10px 18px; padding: 0; }
    #quest-summary li { margin: 0 0 4px; }
    #quest-summary h2, #quest-summary h3, #quest-summary h4 { font-size: 15px; margin: 8px 0 4px; }
    #quest-summary a { color: #15604f; }
  `
  document.head.appendChild(style)
}
