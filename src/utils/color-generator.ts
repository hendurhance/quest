/**
 * Generate random vibrant colors for categories
 * Ensures colors are visually distinct and aesthetically pleasing
 */

/**
 * Generates a random vibrant color in HSL format
 * Uses high saturation (60-90%) and medium lightness (45-65%) for vibrant, readable colors
 */
export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 30) // 60-90%
  const lightness = 45 + Math.floor(Math.random() * 20) // 45-65%
  
  return hslToHex(hue, saturation, lightness)
}

/**
 * Converts HSL color values to HEX format
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = s * Math.min(l, 1 - l) / 100
  
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Generates a set of visually distinct colors
 * Distributes colors evenly across the color wheel
 */
export function generateDistinctColors(count: number): string[] {
  const colors: string[] = []
  const hueStep = 360 / count
  
  for (let i = 0; i < count; i++) {
    const hue = Math.floor(i * hueStep)
    const saturation = 65 + Math.floor(Math.random() * 20) // 65-85%
    const lightness = 50 + Math.floor(Math.random() * 15) // 50-65%
    colors.push(hslToHex(hue, saturation, lightness))
  }
  
  // Shuffle to avoid predictable patterns
  return colors.sort(() => Math.random() - 0.5)
}

/**
 * Check if a color is light or dark (for text contrast)
 */
export function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5
}
