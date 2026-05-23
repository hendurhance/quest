export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function formatDateTime(input: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return date.toLocaleString('en-US', options ?? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const ESSENTIAL_PARAMS = new Set([
  'v', 'video_id', 't', 'time', 'list',
  'id', 'article_id', 'post_id', 'p', 'page_id', 'story_fbid',
  'q', 'query', 's', 'search', 'category', 'tag', 'sort', 'filter',
  'page', 'offset', 'limit',
  'lang', 'locale',
])

/**
 * Normalise a URL into a stable identity key for dedup + matching saved
 * articles to the live page. Forces https, drops `www.` and trailing slashes,
 * keeps only content-identifying query params (tracking params like utm_,
 * fbclid, gclid are dropped), and **drops the fragment** — JS-heavy pages mutate
 * `location.hash` after load (scroll-spy, anchor nav), and a changing hash must
 * not break the match. (Opening still uses the article's full `actual` URL.)
 * Returns the input unchanged if it can't be parsed.
 */
export function normalizeUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)

    const kept = new URLSearchParams()
    u.searchParams.forEach((value, key) => {
      if (ESSENTIAL_PARAMS.has(key.toLowerCase())) kept.append(key, value)
    })
    u.search = kept.toString()
    u.hash = ''

    u.protocol = 'https:'
    u.hostname = u.hostname.replace(/^www\./, '')
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1)
    }

    return u.href.replace(':443/', '/').replace(':80/', '/')
  } catch {
    return url
  }
}
