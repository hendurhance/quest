import { describe, it, expect } from 'vitest'
import {
  generateRandomColor,
  generateDistinctColors,
  isLightColor,
} from '@/utils/color-generator'

describe('color-generator', () => {
  describe('generateRandomColor', () => {
    it('should generate a valid hex color', () => {
      const color = generateRandomColor()
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should generate different colors on multiple calls', () => {
      const colors = new Set()
      for (let i = 0; i < 10; i++) {
        colors.add(generateRandomColor())
      }
      // With high probability, should generate at least some different colors
      expect(colors.size).toBeGreaterThan(1)
    })
  })

  describe('generateDistinctColors', () => {
    it('should generate the requested number of colors', () => {
      const colors = generateDistinctColors(5)
      expect(colors).toHaveLength(5)
    })

    it('should generate valid hex colors', () => {
      const colors = generateDistinctColors(5)
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should generate distinct colors', () => {
      const colors = generateDistinctColors(10)
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(10)
    })

    it('should handle edge case of 1 color', () => {
      const colors = generateDistinctColors(1)
      expect(colors).toHaveLength(1)
      expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('isLightColor', () => {
    it('should identify white as light', () => {
      expect(isLightColor('#ffffff')).toBe(true)
    })

    it('should identify black as dark', () => {
      expect(isLightColor('#000000')).toBe(false)
    })

    it('should identify light gray as light', () => {
      expect(isLightColor('#cccccc')).toBe(true)
    })

    it('should identify dark gray as dark', () => {
      expect(isLightColor('#333333')).toBe(false)
    })

    it('should identify yellow as light', () => {
      expect(isLightColor('#ffff00')).toBe(true)
    })

    it('should identify dark blue as dark', () => {
      expect(isLightColor('#000080')).toBe(false)
    })

    it('should handle colors without # prefix', () => {
      expect(isLightColor('ffffff')).toBe(true)
    })
  })
})
