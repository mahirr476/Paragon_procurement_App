// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Suppress console output during tests for cleaner output
// This hides console.log, console.warn, and console.error from test output
// The tests still work correctly, but you won't see the noise
const originalLog = console.log
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  // Suppress console output during tests
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  // Restore original console methods after tests
  console.log = originalLog
  console.warn = originalWarn
  console.error = originalError
})

