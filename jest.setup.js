// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Load .env.test file for integration tests
if (process.env.NODE_ENV === 'test') {
  const path = require('path')
  const fs = require('fs')
  const dotenv = require('dotenv')
  
  const envTestPath = path.resolve(process.cwd(), '.env.test')
  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath })
    console.log('✅ Loaded .env.test for integration tests')
  } else {
    console.warn('⚠️  .env.test file not found. Integration tests may fail.')
  }
}

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

