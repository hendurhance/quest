import { formatTime } from "@/utils/formatters"

interface ExtractedContent {
  title: string
  content: string
  author?: string
  publishDate?: string
  wordCount: number
}

// ============================================================================
// UI Utilities 
// ============================================================================

const ICONS = {
  play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  layers: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6V12L16 14" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '&times;'
}

interface OverlayConfig {
  position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  width: string
  headerGradient: string
  title: string
  content: string
  styles?: string
}

function removeExistingOverlay(id: string): void {
  const existing = document.getElementById(id)
  if (existing) existing.remove()
}

function createOverlayContainer(id: string, config: OverlayConfig): HTMLDivElement {
  const container = document.createElement('div')
  container.id = id
  
  const positionStyles = getPositionStyles(config.position)
  
  container.innerHTML = `
    <style>
      #${id} {
        position: fixed;
        ${positionStyles}
        width: ${config.width};
        max-height: 80vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideIn 0.3s ease-out;
      }
      #${id} .header {
        background: ${config.headerGradient};
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #${id} .header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      #${id} .close-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      #${id} .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      #${id} .content {
        padding: 20px;
        max-height: calc(80vh - 120px);
        overflow-y: auto;
        line-height: 1.6;
        color: #1f2937;
      }
      ${config.styles || ''}
    </style>
    <div class="header">
      <h3>${config.title}</h3>
      <button class="close-btn">${ICONS.close}</button>
    </div>
    <div class="content">
      ${config.content}
    </div>
  `
  
  return container
}

function getPositionStyles(position: OverlayConfig['position']): string {
  const positions = {
    'top-right': 'top: 20px; right: 20px;',
    'bottom-right': 'bottom: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;'
  }
  return positions[position]
}

function createMetadataItem(icon: string, text: string): string {
  return `<span>${icon} ${text}</span>`
}

function attachCloseHandler(container: HTMLElement, beforeClose?: () => void): void {
  const closeBtn = container.querySelector('.close-btn')
  closeBtn?.addEventListener('click', () => {
    beforeClose?.()
    container.remove()
  })
}

function setupAudioPlayer(container: HTMLElement, _podcastData: any): void {
  const audio = container.querySelector('#podcast-audio') as HTMLAudioElement
  const playBtn = container.querySelector('.play-btn') as HTMLButtonElement
  const currentTimeEl = container.querySelector('.current-time') as HTMLElement
  const totalTimeEl = container.querySelector('.total-time') as HTMLElement
  const progressFill = container.querySelector('.progress-fill') as HTMLElement
  const progressBar = container.querySelector('.progress-bar') as HTMLElement

  let isPlaying = false

  // Update total time when metadata loads
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration)
  })

  // Update progress
  audio.addEventListener('timeupdate', () => {
    currentTimeEl.textContent = formatTime(audio.currentTime)
    progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`
  })

  // Play/pause toggle
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause()
      playBtn.innerHTML = ICONS.play
    } else {
      audio.play()
      playBtn.innerHTML = ICONS.pause
    }
    isPlaying = !isPlaying
  })

  // Seek functionality
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * audio.duration
  })
}


// ============================================================================
// Message Listener
// ============================================================================

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ ready: true })
    return true
  }

  if (message.action === 'getWordCount') {
    const wordCount = calculateWordCount()
    sendResponse({ wordCount })
  }

  if (message.action === 'extractContent') {
    const content = ContentExtractor.extractContent()
    sendResponse({ content })
  }

  if (message.action === 'injectSummary') {
    injectSummaryIntoPage(message.summary, message.metadata)
    sendResponse({ success: true })
  }

  if (message.action === 'injectPodcast') {
    injectPodcastIntoPage(message.podcastData)
    sendResponse({ success: true })
  }

  return true
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

  // Try to find main content area
  for (const selector of contentSelectors) {
    mainContent = document.querySelector(selector)
    if (mainContent) break
  }

  // Fallback to body if no main content found
  if (!mainContent) {
    mainContent = document.body
  }

  // Remove unwanted elements
  const clone = mainContent.cloneNode(true) as HTMLElement
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    '.ad',
    '.advertisement',
    '.sidebar',
    '.comments',
    '.share',
    '.social',
    '.navigation',
    '.menu',
  ]

  unwantedSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove())
  })

  // Get text content and count words
  const text = clone.textContent || clone.innerText || ''
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0)

  return words.length
}

// Enhanced content extraction for article content
const ContentExtractor = {
  extractContent(): ExtractedContent {
    // Try multiple extraction methods in order of preference
    const jsonLdData = this.extractFromJsonLd()
    if (jsonLdData) return jsonLdData

    const ogData = this.extractFromOpenGraph()
    if (ogData) return ogData

    const metaData = this.extractFromMetaTags()
    if (metaData) return metaData

    const semanticData = this.extractFromSemanticHTML()
    if (semanticData) return semanticData

    const selectorData = this.extractFromCommonSelectors()
    if (selectorData) return selectorData

    // Fallback to heuristic extraction
    return this.extractFromHeuristics()
  },

  extractFromJsonLd(): ExtractedContent | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '')
        const article = this.findArticleInJsonLd(data)
        if (article) {
          return {
            title: article.headline || article.name || document.title,
            content: article.articleBody || article.text || '',
            author: article.author?.name || article.author,
            publishDate: article.datePublished,
            wordCount: article.wordCount || 0,
          }
        }
      } catch (e) {
        // Skip invalid JSON
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

    if (data['@graph']) {
      return this.findArticleInJsonLd(data['@graph'])
    }

    return null
  },

  extractFromOpenGraph(): ExtractedContent | null {
    const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
    const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content')

    if (title) {
      return {
        title,
        content: description || '',
        wordCount: 0,
      }
    }

    return null
  },

  extractFromMetaTags(): ExtractedContent | null {
    const title = document.querySelector('meta[name="title"]')?.getAttribute('content')
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')

    if (title) {
      return {
        title,
        content: description || '',
        wordCount: 0,
      }
    }

    return null
  },

  extractFromSemanticHTML(): ExtractedContent | null {
    const article = document.querySelector('article')
    if (!article) return null

    const title = article.querySelector('h1')?.textContent || document.title
    
    // Extract paragraphs and headings for better content
    const contentElements = article.querySelectorAll('p, h2, h3, h4, h5, h6, pre, blockquote, li')
    const content = Array.from(contentElements)
      .map((el) => el.textContent?.trim())
      .filter(text => text && text.length > 0)
      .join('\n\n')

    // If no meaningful content, try just paragraphs
    if (content.length < 100) {
      const paragraphs = article.querySelectorAll('p')
      const paragraphContent = Array.from(paragraphs)
        .map((p) => p.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join('\n\n')
      
      if (paragraphContent.length < 100) {
        return null // Not enough content
      }
      
      return {
        title,
        content: paragraphContent,
        wordCount: paragraphContent.split(/\s+/).length,
      }
    }

    const author = article.querySelector('[rel="author"]')?.textContent ||
      article.querySelector('.author')?.textContent ||
      article.querySelector('[data-testid="authorName"]')?.textContent || // Medium author
      undefined

    const publishDate = article.querySelector('time')?.getAttribute('datetime') ||
      article.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
      undefined

    return {
      title,
      content,
      author,
      publishDate,
      wordCount: content.split(/\s+/).length,
    }
  },

  extractFromCommonSelectors(): ExtractedContent | null {
    const contentSelectors = [
      // Medium.com specific selectors
      { title: 'h1', content: 'article' },
      { title: '[data-testid="storyTitle"]', content: 'article' },
      { title: '.pw-post-title', content: '.pw-post-body' },
      // General selectors
      { title: 'h1', content: 'article' },
      { title: '.post-title', content: '.post-content' },
      { title: '.entry-title', content: '.entry-content' },
      { title: '.article-title', content: '.article-content' },
      { title: '.story-headline', content: '.story-body' },
    ]

    for (const selector of contentSelectors) {
      const titleEl = document.querySelector(selector.title)
      const contentEl = document.querySelector(selector.content)

      if (titleEl && contentEl) {
        const title = titleEl.textContent || document.title
        
        // For Medium and similar sites, extract only paragraph text
        const paragraphs = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6')
        const content = Array.from(paragraphs)
          .map((p) => p.textContent?.trim())
          .filter(text => text && text.length > 0)
          .join('\n\n')

        if (content.length > 100) { // Ensure we got meaningful content
          return {
            title,
            content,
            wordCount: content.split(/\s+/).length,
          }
        }
      }
    }

    return null
  },

  extractFromHeuristics(): ExtractedContent {
    const title = document.title

    // Find the element with the most paragraph content
    const allElements = document.querySelectorAll('div, article, section, main')
    let bestElement: Element | null = null
    let maxScore = 0

    for (const element of allElements) {
      const score = this.scoreElement(element as HTMLElement)
      if (score > maxScore) {
        maxScore = score
        bestElement = element
      }
    }

    const content = bestElement?.textContent || document.body.textContent || ''

    return {
      title,
      content,
      wordCount: content.split(/\s+/).length,
    }
  },

  scoreElement(element: HTMLElement): number {
    let score = 0

    // Count paragraphs
    const paragraphs = element.querySelectorAll('p')
    score += paragraphs.length * 25

    // Count text length
    const textLength = (element.textContent || '').length
    score += Math.min(textLength / 100, 50)

    // Bonus for article-like classes
    const className = element.className.toLowerCase()
    if (className.includes('article') || className.includes('content') || className.includes('post')) {
      score += 25
    }

    // Penalty for nav/sidebar classes
    if (className.includes('nav') || className.includes('sidebar') || className.includes('menu')) {
      score -= 50
    }

    // Check if element has significant content
    if (!this.hasSignificantContent(element)) {
      score -= 25
    }

    return score
  },

  hasSignificantContent(element: HTMLElement): boolean {
    const text = element.textContent || ''
    return text.length > 100 && text.split(/\s+/).length > 20
  },
}

// Content injection functions
function injectSummaryIntoPage(summary: string, metadata: any) {
  removeExistingOverlay('quest-summary')

  const summaryContainer = createOverlayContainer('quest-summary', {
    position: 'top-right',
    width: '400px',
    headerGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    title: 'AI Summary',
    content: `
      <div class="metadata">
        ${createMetadataItem(ICONS.layers, metadata.provider)}
        ${createMetadataItem(ICONS.clock, metadata.date)}
      </div>
      <div class="summary-text">
        ${markdownToHtml(summary)}
      </div>
    `,
    styles: `
      .metadata {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        font-size: 12px;
        color: #6b7280;
      }
      .metadata span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .summary-text {
        font-size: 14px;
      }
      .summary-text p {
        margin-bottom: 12px;
      }
    `
  })

  document.body.appendChild(summaryContainer)
  attachCloseHandler(summaryContainer)
}

function injectPodcastIntoPage(podcastData: any) {
  removeExistingOverlay('quest-podcast')

  const playerContainer = createOverlayContainer('quest-podcast', {
    position: 'bottom-right',
    width: '400px',
    headerGradient: 'linear-gradient(135deg, #1FB6CC 0%, #0B3C49 100%)',
    title: 'Podcast Player',
    content: `
      <div class="controls">
        <button class="play-btn">${ICONS.play}</button>
        <div class="time-display">
          <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <audio id="podcast-audio" src="${podcastData.audioUrl}" preload="metadata"></audio>
    `,
    styles: `
      .controls {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 16px;
      }
      .play-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #1daabf;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .play-btn:hover {
        background: #084158;
        transform: scale(1.05);
      }
      .time-display {
        flex: 1;
        text-align: center;
        font-size: 14px;
        color: #6b7280;
        font-family: monospace;
      }
      .progress-bar {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        cursor: pointer;
      }
      .progress-fill {
        height: 100%;
        background: #1daabf;
        transition: width 0.1s;
      }
    `
  })

  document.body.appendChild(playerContainer)
  setupAudioPlayer(playerContainer, podcastData)
  attachCloseHandler(playerContainer, () => {
    const audio = playerContainer.querySelector('#podcast-audio') as HTMLAudioElement
    audio?.pause()
  })
}

// ============================================================================
// Markdown to HTML Converter
// ============================================================================
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/\_(.*?)\_/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.startsWith('<') && para.trim().length > 0) {
      return `<p>${para}</p>`
    }
    return para
  }).join('')

  return html
}

// ============================================================================
// Global Animations
// ============================================================================

if (!document.querySelector('#quest-animations')) {
  const style = document.createElement('style')
  style.id = 'quest-animations'
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `
  document.head.appendChild(style)
}
