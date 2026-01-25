# Testing Tutorial for Beginners

## Table of Contents
1. [What is Testing?](#what-is-testing)
2. [Why Do We Test?](#why-do-we-test)
3. [Types of Tests Explained](#types-of-tests-explained)
4. [Setting Up Jest](#setting-up-jest)
5. [Writing Your First Test](#writing-your-first-test)
6. [Testing Patterns & Examples](#testing-patterns--examples)
7. [How to Know If You're Testing Correctly](#how-to-know-if-youre-testing-correctly)
8. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
9. [Step-by-Step Testing Workflow](#step-by-step-testing-workflow)
10. [Debugging Failed Tests](#debugging-failed-tests)

---

## What is Testing?

**Testing** is the process of writing code that checks if your application code works correctly.

### Simple Analogy
Imagine you're a teacher grading a math test:
- **Student's Answer** = Your application code
- **Answer Key** = Your test code
- **Grading Process** = Running the tests

If the student's answer matches the answer key, the test passes ✅
If they don't match, the test fails ❌

### Real Example
```javascript
// This is your APPLICATION CODE
function add(a, b) {
  return a + b;
}

// This is your TEST CODE
test('add function should add two numbers', () => {
  const result = add(2, 3);
  expect(result).toBe(5); // ✅ PASS: 2 + 3 = 5
});

test('add function fails when wrong', () => {
  const result = add(2, 3);
  expect(result).toBe(6); // ❌ FAIL: 2 + 3 ≠ 6
});
```

---

## Why Do We Test?

### 1. **Catch Bugs Early**
Tests find errors before users do.

**Without Tests:**
```javascript
function calculateTotal(price, quantity) {
  return price * quantity; // Bug: forgot to handle negative values!
}
```
Users might order -5 items and get refunded money 💸

**With Tests:**
```javascript
test('calculateTotal should reject negative quantity', () => {
  expect(() => calculateTotal(100, -5)).toThrow();
});
// ❌ FAIL - This catches the bug before it reaches production!
```

### 2. **Confidence in Changes**
When you modify code, tests verify you didn't break anything.

**Scenario:** You refactor a function
**Without Tests:** 😰 "Did I break something? Let me manually check everything..."
**With Tests:** 😎 Run tests → All pass → You're good to go!

### 3. **Documentation**
Tests show how your code is supposed to work.

```javascript
test('parseDate converts DD/MM/YY to Date object', () => {
  expect(parseDate('15/03/24')).toEqual(new Date('2024-03-15'));
});
```
New developers can read this test and understand what `parseDate` does.

### 4. **Save Time**
Manual testing: Click through UI → Enter data → Check result → Repeat 100 times
Automated testing: Run `npm test` → Get results in seconds

---

## Types of Tests Explained

### 1. Unit Tests

**What:** Test a single function or component in isolation
**Analogy:** Testing one gear in a clock to make sure it spins correctly

**Example:**
```javascript
// FILE: lib/csv-parser.ts
export function parseNumber(str: string): number {
  return parseFloat(str.replace(/,/g, ''));
}

// FILE: lib/csv-parser.test.ts
import { parseNumber } from './csv-parser';

describe('parseNumber', () => {
  test('removes commas from numbers', () => {
    expect(parseNumber('1,000')).toBe(1000);
  });

  test('handles decimals', () => {
    expect(parseNumber('1,000.50')).toBe(1000.5);
  });

  test('returns 0 for empty string', () => {
    expect(parseNumber('')).toBe(0);
  });
});
```

**When to Use:**
- Testing utility functions
- Testing data parsing logic
- Testing calculations
- Testing business logic

**How to Know You're Doing It Right:**
✅ Test focuses on ONE function
✅ No external dependencies (database, API, files)
✅ Fast to run (<10ms per test)
✅ Easy to understand what broke when test fails

---

### 2. Integration Tests

**What:** Test how multiple parts work together
**Analogy:** Testing if all the gears in a clock work together to show the correct time

**Example:**
```javascript
// Integration test: CSV Parser + API
describe('CSV Upload Integration', () => {
  test('parses CSV and saves to database', async () => {
    // 1. Parse CSV
    const csvContent = 'Date,Supplier,Order No.\n15/03/24,ABC Corp,PO-001';
    const pos = parseCSV(csvContent);

    // 2. Save to database
    const response = await fetch('/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos }),
    });

    // 3. Verify saved
    expect(response.ok).toBe(true);
    const saved = await response.json();
    expect(saved.count).toBe(1);

    // 4. Query database to confirm
    const dbPos = await prisma.purchaseOrder.findMany();
    expect(dbPos[0].supplier).toBe('ABC Corp');
  });
});
```

**When to Use:**
- Testing CSV upload → database save
- Testing API endpoint → database query
- Testing component → API call
- Testing multiple functions that depend on each other

**How to Know You're Doing It Right:**
✅ Tests multiple components together
✅ Tests the flow between components
✅ Uses real or mock database
✅ Slower than unit tests (100-1000ms)

---

### 3. End-to-End (E2E) Tests

**What:** Test the entire user workflow from start to finish
**Analogy:** Testing the entire clock: wind it up, watch it tick, verify it shows correct time

**Example:**
```javascript
describe('Complete PO Approval Workflow', () => {
  test('user uploads CSV, reviews, approves, sees on dashboard', async () => {
    // 1. User uploads CSV file
    const file = new File(['Date,Supplier\n15/03/24,ABC'], 'test.csv');
    await uploadCSV(file);

    // 2. Navigate to upload page
    await page.goto('/upload');

    // 3. Verify POs appear
    expect(await page.textContent('.pending-count')).toBe('1 PO');

    // 4. Select and approve
    await page.click('[data-testid="select-all"]');
    await page.click('[data-testid="approve-btn"]');

    // 5. Navigate to dashboard
    await page.goto('/');

    // 6. Verify PO appears in approved list
    expect(await page.textContent('.approved-count')).toBe('1 PO');
    expect(await page.textContent('.supplier-name')).toBe('ABC');
  });
});
```

**When to Use:**
- Testing complete user journeys
- Testing critical business flows
- Testing before deployment

**How to Know You're Doing It Right:**
✅ Simulates real user behavior
✅ Tests multiple pages/screens
✅ Interacts with UI elements
✅ Slowest tests (5-30 seconds each)
✅ Most expensive to maintain

---

### 4. Component Tests (Frontend)

**What:** Test React components in isolation
**Analogy:** Testing a dashboard gauge to make sure it displays the right number

**Example:**
```javascript
import { render, screen } from '@testing-library/react';
import DashboardOverview from '@/components/dashboard-overview';

describe('DashboardOverview', () => {
  test('displays total POs count', () => {
    const mockPOs = [
      { id: '1', totalAmount: 1000 },
      { id: '2', totalAmount: 2000 },
    ];

    render(<DashboardOverview pos={mockPOs} />);

    expect(screen.getByText('Total POs: 2')).toBeInTheDocument();
  });

  test('calculates total amount correctly', () => {
    const mockPOs = [
      { id: '1', totalAmount: 1000 },
      { id: '2', totalAmount: 2000 },
    ];

    render(<DashboardOverview pos={mockPOs} />);

    expect(screen.getByText('₹3,000')).toBeInTheDocument();
  });
});
```

**When to Use:**
- Testing UI components
- Testing component rendering
- Testing user interactions (clicks, typing)

**How to Know You're Doing It Right:**
✅ Component renders without errors
✅ Props affect rendered output
✅ User interactions work
✅ No actual API calls (use mocks)

---

## Setting Up Jest

### Step 1: Install Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

### Step 2: Create `jest.config.js`

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### Step 3: Create `jest.setup.js`

```javascript
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
```

### Step 4: Add Test Scripts to `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 5: Create Your First Test File

**Naming Convention:**
- Test files end with `.test.ts` or `.test.tsx`
- Place test files next to the code they test OR in a `__tests__` folder

**Example:**
```
lib/
  csv-parser.ts          ← Your code
  csv-parser.test.ts     ← Your test
```

OR

```
lib/
  csv-parser.ts          ← Your code
  __tests__/
    csv-parser.test.ts   ← Your test
```

---

## Writing Your First Test

### Step-by-Step Example

Let's test this function from our CSV parser:

```typescript
// FILE: lib/csv-parser.ts
export function parseNumber(str: string): number {
  if (!str || str.trim() === '') return 0;
  return parseFloat(str.replace(/,/g, ''));
}
```

### Create Test File

```typescript
// FILE: lib/csv-parser.test.ts

// Step 1: Import the function you want to test
import { parseNumber } from './csv-parser';

// Step 2: Create a test suite (group of related tests)
describe('parseNumber', () => {

  // Step 3: Write individual test cases
  test('converts string number to float', () => {
    // Arrange: Set up test data
    const input = '100';

    // Act: Run the function
    const result = parseNumber(input);

    // Assert: Check if result is correct
    expect(result).toBe(100);
  });

  test('removes commas from numbers', () => {
    const input = '1,000';
    const result = parseNumber(input);
    expect(result).toBe(1000);
  });

  test('handles decimal numbers', () => {
    const input = '1,000.50';
    const result = parseNumber(input);
    expect(result).toBe(1000.5);
  });

  test('returns 0 for empty string', () => {
    const input = '';
    const result = parseNumber(input);
    expect(result).toBe(0);
  });

  test('returns 0 for whitespace', () => {
    const input = '   ';
    const result = parseNumber(input);
    expect(result).toBe(0);
  });
});
```

### Run Your Tests

```bash
npm test
```

**Expected Output:**
```
PASS  lib/csv-parser.test.ts
  parseNumber
    ✓ converts string number to float (2ms)
    ✓ removes commas from numbers (1ms)
    ✓ handles decimal numbers (1ms)
    ✓ returns 0 for empty string (1ms)
    ✓ returns 0 for whitespace (1ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

---

## Testing Patterns & Examples

### Pattern 1: Arrange-Act-Assert (AAA)

This is the most common testing pattern.

```javascript
test('example test using AAA pattern', () => {
  // ARRANGE: Set up test data and conditions
  const price = 100;
  const quantity = 5;

  // ACT: Execute the code being tested
  const result = calculateTotal(price, quantity);

  // ASSERT: Verify the result
  expect(result).toBe(500);
});
```

### Pattern 2: Testing with Different Inputs

Use `test.each` to run the same test with different data:

```javascript
describe('parseDate', () => {
  test.each([
    ['15/03/24', new Date('2024-03-15')],
    ['01/01/00', new Date('2000-01-01')],
    ['31/12/99', new Date('1999-12-31')],
  ])('converts %s to %s', (input, expected) => {
    expect(parseDate(input)).toEqual(expected);
  });
});
```

**Output:**
```
✓ converts 15/03/24 to Fri Mar 15 2024
✓ converts 01/01/00 to Sat Jan 01 2000
✓ converts 31/12/99 to Fri Dec 31 1999
```

### Pattern 3: Testing Errors

Test that your function throws errors when it should:

```javascript
test('throws error for invalid date', () => {
  expect(() => {
    parseDate('invalid');
  }).toThrow('Invalid date format');
});

// Alternative syntax
test('throws error for negative quantity', () => {
  expect(() => calculateTotal(100, -5)).toThrow();
});
```

### Pattern 4: Testing Async Functions

Use `async/await` for functions that return promises:

```javascript
test('fetchPOs returns array of POs', async () => {
  // Act
  const pos = await fetchPOs();

  // Assert
  expect(Array.isArray(pos)).toBe(true);
  expect(pos.length).toBeGreaterThan(0);
});
```

### Pattern 5: Mocking External Dependencies

**Mock API calls:**
```javascript
// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, count: 10 }),
  })
);

test('saveCurrentPOs calls API correctly', async () => {
  const mockPOs = [{ id: '1', supplier: 'ABC' }];

  const result = await saveCurrentPOs(mockPOs);

  expect(fetch).toHaveBeenCalledWith('/api/pos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pos: mockPOs }),
  });
  expect(result.count).toBe(10);
});
```

**Mock database:**
```javascript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      createMany: jest.fn(() => Promise.resolve({ count: 5 })),
      findMany: jest.fn(() => Promise.resolve([])),
    },
  },
}));
```

### Pattern 6: Testing React Components

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import CSVUploader from '@/components/csv-uploader';

describe('CSVUploader', () => {
  test('renders upload button', () => {
    render(<CSVUploader onUploadSuccess={jest.fn()} />);

    const button = screen.getByText(/upload csv/i);
    expect(button).toBeInTheDocument();
  });

  test('calls onUploadSuccess when upload completes', async () => {
    const mockOnSuccess = jest.fn();
    render(<CSVUploader onUploadSuccess={mockOnSuccess} />);

    // Simulate file upload
    const file = new File(['Date,Supplier\n15/03/24,ABC'], 'test.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/upload/i);

    fireEvent.change(input, { target: { files: [file] } });

    // Wait for async operations
    await screen.findByText(/upload successful/i);

    expect(mockOnSuccess).toHaveBeenCalledWith(1);
  });
});
```

---

## How to Know If You're Testing Correctly

### ✅ Good Test Checklist

1. **Test is Independent**
   ```javascript
   // ✅ GOOD: Each test is self-contained
   test('test 1', () => {
     const data = createTestData();
     expect(processData(data)).toBe(expected);
   });

   test('test 2', () => {
     const data = createTestData();
     expect(processData(data)).toBe(expected);
   });
   ```

   ```javascript
   // ❌ BAD: Tests depend on each other
   let sharedData;

   test('test 1', () => {
     sharedData = createTestData();
   });

   test('test 2', () => {
     // This fails if test 1 doesn't run first!
     expect(processData(sharedData)).toBe(expected);
   });
   ```

2. **Test is Readable**
   ```javascript
   // ✅ GOOD: Clear what's being tested
   test('calculates total amount by multiplying price and quantity', () => {
     expect(calculateTotal(100, 5)).toBe(500);
   });
   ```

   ```javascript
   // ❌ BAD: Unclear what's being tested
   test('test 1', () => {
     expect(calc(100, 5)).toBe(500);
   });
   ```

3. **Test is Fast**
   - Unit tests: <10ms
   - Integration tests: <1 second
   - E2E tests: <30 seconds

4. **Test Has Clear Failure Message**
   ```javascript
   // ✅ GOOD: Custom error message
   expect(result.supplier).toBe('ABC Corp');
   // Error: Expected "XYZ Ltd" to equal "ABC Corp"
   ```

5. **Test Tests One Thing**
   ```javascript
   // ✅ GOOD: One assertion
   test('parseNumber removes commas', () => {
     expect(parseNumber('1,000')).toBe(1000);
   });

   // ✅ GOOD: Multiple related assertions
   test('parseCSV returns valid PO objects', () => {
     const pos = parseCSV(csvContent);
     expect(pos).toHaveLength(1);
     expect(pos[0].supplier).toBe('ABC');
     expect(pos[0].orderNo).toBe('PO-001');
   });
   ```

   ```javascript
   // ❌ BAD: Testing multiple unrelated things
   test('everything works', () => {
     expect(parseNumber('1,000')).toBe(1000);
     expect(parseDate('15/03/24')).toEqual(new Date('2024-03-15'));
     expect(calculateTotal(100, 5)).toBe(500);
     // If this fails, which function is broken?
   });
   ```

### 🎯 Test Coverage Goals

**What is Coverage?**
Coverage measures what percentage of your code is executed by tests.

**Check Coverage:**
```bash
npm test -- --coverage
```

**Output:**
```
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
csv-parser.ts     |   95.5  |   88.9   |  100.0  |   95.2  |
storage.ts        |   80.0  |   75.0   |   85.7  |   79.5  |
```

**What Each Means:**
- **Stmts** (Statements): Percentage of code lines executed
- **Branch**: Percentage of if/else branches tested
- **Funcs**: Percentage of functions called
- **Lines**: Percentage of lines executed

**Good Coverage Targets:**
- Critical code (CSV parser, API endpoints): 90%+
- Regular code: 70-80%
- UI components: 60-70%

**⚠️ Important:** 100% coverage ≠ perfect tests
You can have 100% coverage but still miss edge cases!

---

## Common Mistakes to Avoid

### Mistake 1: Testing Implementation Details

```javascript
// ❌ BAD: Testing how it works internally
test('uses Array.map to transform data', () => {
  const spy = jest.spyOn(Array.prototype, 'map');
  transformData([1, 2, 3]);
  expect(spy).toHaveBeenCalled();
});
```

```javascript
// ✅ GOOD: Testing what it does
test('transforms data correctly', () => {
  const result = transformData([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);
});
```

**Why?** If you refactor to use `for` loop instead of `map`, the bad test breaks even though functionality is the same.

### Mistake 2: Not Testing Edge Cases

```javascript
// ❌ BAD: Only testing happy path
test('parseNumber works', () => {
  expect(parseNumber('100')).toBe(100);
});
```

```javascript
// ✅ GOOD: Testing edge cases too
test('parseNumber handles various inputs', () => {
  expect(parseNumber('100')).toBe(100);
  expect(parseNumber('')).toBe(0);
  expect(parseNumber('abc')).toBe(0);
  expect(parseNumber('1,000.50')).toBe(1000.5);
  expect(parseNumber('-50')).toBe(-50);
});
```

### Mistake 3: Tests That Always Pass

```javascript
// ❌ BAD: This test will never fail!
test('function exists', () => {
  expect(parseNumber).toBeDefined();
});
```

```javascript
// ✅ GOOD: Tests actual behavior
test('parseNumber converts string to number', () => {
  expect(parseNumber('100')).toBe(100);
});
```

### Mistake 4: Slow Tests

```javascript
// ❌ BAD: Waiting unnecessarily
test('processes data', async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  expect(processData()).toBe(true);
});
```

```javascript
// ✅ GOOD: Mock timers
test('processes data', () => {
  jest.useFakeTimers();
  processData();
  jest.runAllTimers();
  expect(result).toBe(true);
});
```

### Mistake 5: Brittle Tests

```javascript
// ❌ BAD: Breaks if CSS class name changes
test('renders button', () => {
  render(<Button />);
  expect(document.querySelector('.btn-primary')).toBeInTheDocument();
});
```

```javascript
// ✅ GOOD: Uses test IDs or accessible queries
test('renders button', () => {
  render(<Button />);
  expect(screen.getByRole('button')).toBeInTheDocument();
  // or
  expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
});
```

---

## Step-by-Step Testing Workflow

### For Each Function You Write:

#### Step 1: Write the Function
```typescript
// lib/csv-parser.ts
export function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  const date = new Date(fullYear, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}
```

#### Step 2: Create Test File
```typescript
// lib/csv-parser.test.ts
import { parseDate } from './csv-parser';

describe('parseDate', () => {
  // Tests will go here
});
```

#### Step 3: Write Basic Test
```typescript
test('parses DD/MM/YY format', () => {
  const result = parseDate('15/03/24');
  expect(result).toEqual(new Date(2024, 2, 15)); // Month is 0-indexed
});
```

#### Step 4: Run Test
```bash
npm test csv-parser.test.ts
```

#### Step 5: Add More Test Cases
```typescript
test('parses DD/MM/YYYY format', () => {
  expect(parseDate('15/03/2024')).toEqual(new Date(2024, 2, 15));
});

test('returns null for invalid format', () => {
  expect(parseDate('invalid')).toBe(null);
});

test('returns null for invalid date', () => {
  expect(parseDate('32/13/2024')).toBe(null);
});

test('handles 2-digit year 00-49 as 2000-2049', () => {
  expect(parseDate('15/03/24')).toEqual(new Date(2024, 2, 15));
});

test('handles 2-digit year 50-99 as 1950-1999', () => {
  expect(parseDate('15/03/99')).toEqual(new Date(1999, 2, 15));
});
```

#### Step 6: Verify Coverage
```bash
npm test -- --coverage csv-parser.test.ts
```

#### Step 7: Fix Any Uncovered Code
If coverage shows you missed something, add tests for it.

---

## Debugging Failed Tests

### When a Test Fails

**Example Failed Test:**
```
FAIL  lib/csv-parser.test.ts
  parseNumber
    ✕ removes commas from numbers (5ms)

  ● parseNumber › removes commas from numbers

    expect(received).toBe(expected) // Object.is equality

    Expected: 1000
    Received: "1,000"

      12 |   test('removes commas from numbers', () => {
      13 |     const result = parseNumber('1,000');
    > 14 |     expect(result).toBe(1000);
         |                    ^
      15 |   });
```

### Debug Steps:

#### 1. Read the Error Message
- **Expected:** What the test expected
- **Received:** What it actually got
- **Line Number:** Where the assertion failed

#### 2. Add Console Logs
```javascript
test('removes commas from numbers', () => {
  const input = '1,000';
  const result = parseNumber(input);

  console.log('Input:', input);
  console.log('Result:', result);
  console.log('Type:', typeof result);

  expect(result).toBe(1000);
});
```

#### 3. Check the Function
```typescript
export function parseNumber(str: string): number {
  // BUG: Forgot to call parseFloat!
  return str.replace(/,/g, '');
}
```

#### 4. Fix the Bug
```typescript
export function parseNumber(str: string): number {
  return parseFloat(str.replace(/,/g, '')); // ✅ Fixed!
}
```

#### 5. Run Test Again
```bash
npm test
```

```
PASS  lib/csv-parser.test.ts
  parseNumber
    ✓ removes commas from numbers (2ms)
```

---

## Real-World Testing Examples

### Example 1: Testing CSV Parser

```typescript
// lib/csv-parser.test.ts
import { parseCSV } from './csv-parser';

describe('parseCSV', () => {
  test('parses simple CSV with one row', () => {
    const csv = `Date,Supplier,Order No.
15/03/24,ABC Corp,PO-001`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].supplier).toBe('ABC Corp');
    expect(result[0].orderNo).toBe('PO-001');
    expect(result[0].date).toEqual(new Date('2024-03-15'));
  });

  test('parses CSV with multiple rows', () => {
    const csv = `Date,Supplier,Order No.
15/03/24,ABC Corp,PO-001
16/03/24,XYZ Ltd,PO-002`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0].supplier).toBe('ABC Corp');
    expect(result[1].supplier).toBe('XYZ Ltd');
  });

  test('handles empty CSV', () => {
    const csv = '';
    const result = parseCSV(csv);
    expect(result).toEqual([]);
  });

  test('handles CSV with only headers', () => {
    const csv = 'Date,Supplier,Order No.';
    const result = parseCSV(csv);
    expect(result).toEqual([]);
  });

  test('handles quoted fields with commas', () => {
    const csv = `Date,Supplier,Item
15/03/24,ABC Corp,"Widget, Large"`;

    const result = parseCSV(csv);
    expect(result[0].item).toBe('Widget, Large');
  });

  test('detects OLD format (no Weight column)', () => {
    const csvOld = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate`;
    const result = parseCSV(csvOld);
    // Verify it doesn't have weight field
  });

  test('detects NEW format (with Weight column)', () => {
    const csvNew = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Weight,Unit,Rate`;
    const result = parseCSV(csvNew);
    // Verify it has weight field
  });
});
```

### Example 2: Testing API Endpoint

```typescript
// app/api/pos/route.test.ts
import { POST, GET } from './route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('POST /api/pos', () => {
  test('saves POs to database', async () => {
    const mockPOs = [
      { id: 'PO-1', supplier: 'ABC Corp', totalAmount: 1000 },
    ];

    // Mock database response
    (prisma.purchaseOrder.createMany as jest.Mock).mockResolvedValue({
      count: 1,
    });

    // Create request
    const request = new Request('http://localhost/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos: mockPOs }),
    });

    // Call endpoint
    const response = await POST(request);
    const data = await response.json();

    // Verify
    expect(prisma.purchaseOrder.createMany).toHaveBeenCalledWith({
      data: mockPOs,
      skipDuplicates: true,
    });
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
  });

  test('returns error when no POs provided', async () => {
    const request = new Request('http://localhost/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe('GET /api/pos', () => {
  test('returns approved POs when approved=true', async () => {
    const mockPOs = [
      { id: 'PO-1', supplier: 'ABC', isApproved: true },
    ];

    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPOs);

    const request = new Request('http://localhost/api/pos?approved=true');
    const response = await GET(request);
    const data = await response.json();

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith({
      where: { isApproved: true },
      orderBy: { uploadedAt: 'desc' },
    });
    expect(data.pos).toEqual(mockPOs);
  });
});
```

### Example 3: Testing React Component

```typescript
// components/csv-uploader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CSVUploader from './csv-uploader';
import { saveCurrentPOs } from '@/lib/storage';

// Mock the storage module
jest.mock('@/lib/storage');

describe('CSVUploader', () => {
  test('renders upload button', () => {
    render(<CSVUploader onUploadSuccess={jest.fn()} />);

    expect(screen.getByText(/upload csv/i)).toBeInTheDocument();
  });

  test('shows error for non-CSV file', async () => {
    render(<CSVUploader onUploadSuccess={jest.fn()} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/please upload a csv file/i)).toBeInTheDocument();
    });
  });

  test('uploads CSV successfully', async () => {
    const mockOnSuccess = jest.fn();
    (saveCurrentPOs as jest.Mock).mockResolvedValue({ success: true, count: 5 });

    render(<CSVUploader onUploadSuccess={mockOnSuccess} />);

    const csvContent = 'Date,Supplier\n15/03/24,ABC\n16/03/24,XYZ';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(5);
  });

  test('shows loading state during upload', async () => {
    (saveCurrentPOs as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, count: 1 }), 100))
    );

    render(<CSVUploader onUploadSuccess={jest.fn()} />);

    const file = new File(['Date,Supplier\n15/03/24,ABC'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload/i);

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
    });
  });
});
```

---

## Quick Reference: Jest Matchers

### Common Matchers

```javascript
// Equality
expect(value).toBe(5);                    // Exact equality (===)
expect(value).toEqual({ a: 1 });          // Deep equality (objects/arrays)
expect(value).not.toBe(10);               // Not equal

// Truthiness
expect(value).toBeTruthy();               // true, 1, "string"
expect(value).toBeFalsy();                // false, 0, "", null, undefined
expect(value).toBeNull();                 // null
expect(value).toBeUndefined();            // undefined
expect(value).toBeDefined();              // not undefined

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeGreaterThanOrEqual(10);
expect(value).toBeLessThan(10);
expect(value).toBeLessThanOrEqual(10);
expect(value).toBeCloseTo(0.3);           // For floating point

// Strings
expect(string).toMatch(/regex/);
expect(string).toMatch('substring');
expect(string).toContain('substring');

// Arrays
expect(array).toContain('item');
expect(array).toHaveLength(5);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');
expect(obj).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
expect(() => fn()).toThrow(Error);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
```

---

## Checklist: Before Submitting Your Tests

- [ ] All tests pass (`npm test`)
- [ ] Tests are independent (can run in any order)
- [ ] Each test has a descriptive name
- [ ] Edge cases are tested
- [ ] Error cases are tested
- [ ] Coverage is above 70% (`npm test -- --coverage`)
- [ ] No console errors or warnings
- [ ] Tests run fast (<1 second for unit tests)
- [ ] Mocks are used for external dependencies
- [ ] Tests are readable and maintainable

---

## Next Steps

1. **Start Small:** Test one simple function
2. **Run Often:** Run tests after every change
3. **Add Gradually:** Add more tests as you write more code
4. **Learn from Failures:** Failed tests teach you about edge cases
5. **Refactor:** Improve tests as you learn better patterns

---

## Additional Resources

### Official Documentation
- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/react
- Testing Best Practices: https://testingjavascript.com/

### Helpful Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test csv-parser.test.ts

# Run tests in watch mode (re-runs on file change)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run only tests matching pattern
npm test -- --testNamePattern="parseNumber"

# Update snapshots
npm test -- -u

# Run tests in specific folder
npm test -- app/api

# Verbose output
npm test -- --verbose
```

---

## Remember

> "Testing doesn't prove the absence of bugs, but it greatly reduces their likelihood."

**The best time to write tests:**
1. When writing new code (Test-Driven Development)
2. When fixing a bug (write test first, then fix)
3. Before refactoring (tests ensure you don't break anything)

**Start testing today!** 🚀
