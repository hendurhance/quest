/**
 * Common formatting utilities used across the application
 */

/**
 * Format a date as a relative time string (e.g., "2h ago", "3d ago")
 * @param dateString - ISO date string or Date object
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  if (diffDays >= 365) return `${Math.floor(diffDays / 365)}y ago`
  
  return date.toLocaleDateString()
}

/**
 * Format a date/time as a locale string (e.g., "Jan 15, 02:30 PM")
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date/time string
 */
export const formatDateTime = (
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return date.toLocaleString('en-US', options || defaultOptions)
}

/**
 * Format a date as a full date string (e.g., "January 15, 2024")
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format a date as a short date string (e.g., "1/15/24")
 * @param dateString - ISO date string or Date object
 * @returns Formatted short date string
 */
export const formatShortDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
}

/**
 * Format bytes to human readable size (e.g., "1.5 MB", "234 KB")
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Capitalize the first letter of a string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeFirst = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Normalizes a URL for duplicate detection while preserving important parameters
 * 
 * This function creates a "clean" version of URLs that can be used to detect duplicates
 * while preserving essential query parameters and fragments that define unique content.
 * 
 * Rules:
 * 1. Always preserves essential parameters (video IDs, article IDs, post IDs, etc.)
 * 2. Removes tracking parameters (utm_*, fbclid, gclid, etc.)
 * 3. Removes session IDs and temporary tokens
 * 4. Preserves fragments for single-page apps and specific sections
 * 5. Normalizes protocol (http/https), www prefix, and trailing slashes
 * 
 * @param url - The URL to normalize
 * @returns A normalized URL suitable for duplicate detection
 * 
 * @example
 * normalizeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter')
 * // Returns: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
 * 
 * @example
 * normalizeUrl('https://example.com/article?id=123&fbclid=xyz')
 * // Returns: 'https://example.com/article?id=123'
 * 
 * @example
 * normalizeUrl('https://github.com/user/repo#readme')
 * // Returns: 'https://github.com/user/repo#readme'
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    
    // Essential parameters that identify unique content
    // These are commonly used across different platforms
    const essentialParams = new Set([
      // Video platforms
      'v',           // YouTube video ID
      'video_id',    // Alternative video ID
      't',           // YouTube timestamp
      'time',        // Video timestamp
      'list',        // YouTube playlist
      
      // Article/Post identifiers
      'id',          // Generic ID
      'article_id',  // Article ID
      'post_id',     // Post ID
      'p',           // Common post parameter
      'page_id',     // Page ID
      'story_fbid',  // Facebook story ID
      
      // Search and filters
      'q',           // Search query
      'query',       // Alternative search query
      's',           // Search (WordPress)
      'search',      // Search parameter
      'category',    // Category filter
      'tag',         // Tag filter
      'sort',        // Sort order
      'filter',      // Filter parameter
      
      // Pagination
      'page',        // Page number
      'offset',      // Pagination offset
      'limit',       // Pagination limit
      
      // State/Context
      'lang',        // Language
      'locale',      // Locale
      'ref',         // Reference (when essential to content)
    ])
    
    // Tracking/analytics parameters to remove
    const trackingParams = new Set([
      // UTM parameters (Google Analytics)
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'utm_id',
      'utm_source_platform',
      'utm_creative_format',
      'utm_marketing_tactic',
      
      // Facebook tracking
      'fbclid',
      'fb_action_ids',
      'fb_action_types',
      'fb_ref',
      'fb_source',
      
      // Google tracking
      'gclid',
      'gclsrc',
      'dclid',
      'gbraid',
      'wbraid',
      
      // Other tracking
      'mc_cid',          // MailChimp
      'mc_eid',          // MailChimp
      '_hsenc',          // HubSpot
      '_hsmi',           // HubSpot
      'mkt_tok',         // Marketo
      'referrer',        // Referrer tracking
      'source',          // Generic source
      'campaign',        // Generic campaign
      
      // Session/temporary
      'session_id',
      'sid',
      'ssid',
      'token',
      'key',
      '_',               // Cache buster
      'timestamp',
      'rand',
      'random',
    ])
    
    // Filter query parameters
    const filteredParams = new URLSearchParams()
    urlObj.searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      // Keep if essential AND not tracking
      if (essentialParams.has(lowerKey) && !trackingParams.has(lowerKey)) {
        filteredParams.append(key, value)
      }
    })
    
    // Rebuild URL with filtered parameters
    urlObj.search = filteredParams.toString()
    
    // Normalize the URL:
    // 1. Use https (most sites redirect http to https anyway)
    urlObj.protocol = 'https:'
    
    // 2. Remove 'www.' prefix (www.example.com === example.com)
    urlObj.hostname = urlObj.hostname.replace(/^www\./, '')
    
    // 3. Remove trailing slash from pathname (unless it's just '/')
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1)
    }
    
    // 4. Preserve fragment (hash) as it often identifies specific sections
    // Examples: #readme, #installation, #section-3
    // Note: We keep the fragment because it's essential for single-page apps
    // and specific document sections
    
    // Convert back to string
    let normalized = urlObj.href
    
    // Remove default ports
    normalized = normalized.replace(':443/', '/')
    normalized = normalized.replace(':80/', '/')
    
    return normalized
  } catch (error) {
    // If URL parsing fails, return the original URL
    // This handles edge cases like relative URLs or malformed URLs
    return url
  }
}
