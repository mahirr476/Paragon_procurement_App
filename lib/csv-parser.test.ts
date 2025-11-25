import { parseDate, parseCSV } from './csv-parser'

describe('CSV Parser', () => {
  // ============================================
  // SECTION 1.1: Date Parsing Tests
  // ============================================
  // TODO: Add more tests as we progress through the guide

  describe('parseDate - Basic Date Parsing', () => {
    test('parses "15/03/24" to 2024-03-15 (DD/MM/YY format)', () => {
      const result = parseDate('15/03/24')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(2) // March is month 2 (0-indexed)
      expect(result?.getDate()).toBe(15)
    })

    test('parses "15/03/2024" to 2024-03-15 (DD/MM/YYYY format)', () => {
      const result = parseDate('15/03/2024')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(2)
      expect(result?.getDate()).toBe(15)
    })

    test('returns null for invalid date "32/13/2024"', () => {
      const result = parseDate('32/13/2024')
      expect(result).toBeNull()
    })

    test('parses "29/02/2024" to 2024-02-29 (leap year)', () => {
      const result = parseDate('29/02/2024')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(1) // February is month 1
      expect(result?.getDate()).toBe(29)
    })

    test('returns null for empty string', () => {
      const result = parseDate('')
      expect(result).toBeNull()
    })
  })
})

