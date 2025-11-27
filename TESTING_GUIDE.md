# PO-APP Testing Guide

## Overview

This guide provides a comprehensive testing checklist for the PO-APP (Purchase Order Management Application). The primary focus is on **data integrity** - ensuring that values from uploaded CSV files remain accurate and consistent throughout the entire application lifecycle.

---

## Testing Philosophy

**Core Principle:** Every data value from the CSV file must be traceable and verifiable from upload through database storage to final display on the frontend.

### Critical Path
```
CSV File → Parser → Database → API → Frontend Display
```

Every stage in this pipeline must be tested to ensure:
- No data loss
- No data corruption
- No data transformation errors
- Proper error handling
- Consistent state management

---

## Test Stack Setup

### Required Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

### Configuration Files Needed
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test environment setup
- `.env.test` - Test environment variables

---

## BACKEND TESTING CHECKLIST

### 1. CSV Parsing & Data Integrity (`lib/csv-parser.ts`)

#### 1.1 Date Parsing Tests
- [ ] **Date Format: DD/MM/YY**
  - Test: `"15/03/24"` → `2024-03-15`
  - Test: `"01/01/00"` → `2000-01-01`
  - Test: `"31/12/99"` → `1999-12-31`
  - Test: `"15/03/50"` → `1950-03-15` (50-99 → 1950-1999)

- [ ] **Date Format: DD/MM/YYYY**
  - Test: `"15/03/2024"` → `2024-03-15`
  - Test: `"01/01/2000"` → `2000-01-01`
  - Test: `"31/12/2025"` → `2025-12-25`

- [ ] **Date Format: ISO**
  - Test: `"2024-03-15"` → `2024-03-15`
  - Test: `"2024-03-15T10:30:00Z"` → `2024-03-15`

- [ ] **Invalid Dates - Should Reject**
  - Test: `"32/13/2024"` → `null`
  - Test: `"00/00/00"` → `null`
  - Test: `"invalid"` → `null`
  - Test: Empty string → `null`
  - Test: `"99/99/99"` → `null`

- [ ] **Edge Case Dates**
  - Test: `"29/02/2024"` → `2024-02-29` (leap year)
  - Test: `"29/02/2023"` → `null` (not leap year)
  - Test: `"31/04/2024"` → `null` (April has 30 days)

#### 1.2 CSV Parsing Tests
- [ ] **Header Detection**
  - Test: OLD format (no "Weight" column) → format = "OLD"
  - Test: NEW format (includes "Weight" column) → format = "NEW"
  - Test: Mixed/malformed headers → error handling

- [ ] **Quoted Field Handling**
  - Test: `"Item A, B"` with commas inside quotes
  - Test: `"Item ""Special"""` with escaped quotes
  - Test: `"Line 1\nLine 2"` with newlines in quotes
  - Test: Mixed quoted and unquoted fields

- [ ] **Empty Fields**
  - Test: `,,` (consecutive commas) → empty strings
  - Test: Trailing commas → empty last field
  - Test: Leading commas → empty first field

- [ ] **Line Handling**
  - Test: Skip completely empty lines
  - Test: Skip lines with only commas
  - Test: Handle Windows line endings (`\r\n`)
  - Test: Handle Unix line endings (`\n`)

#### 1.3 Column Mapping Tests

**OLD Format (26 columns):**
```
Date, Supplier, Order No., Ref No., Due Date, Branch, Requisition Type,
Item/Ledger Group, Item, Min Qty, Max Qty, Unit, Rate, Delivery Date,
CGST, SGST, IGST, VAT, Last Approved Rate, Last Supplier, Broker,
Total Amount, Status, Delivery Type, Open PO, Open PO No.
```

- [ ] **OLD Format Column Mapping**
  - Test: Column 0 → Date
  - Test: Column 1 → Supplier
  - Test: Column 11 → Unit (not Weight)
  - Test: Column 12 → Rate
  - Test: Column 14 → CGST (not Pending Wt.)
  - Test: Column 21 → Total Amount
  - Test: All 26 fields map correctly

**NEW Format (28 columns):**
```
Date, Supplier, Order No., Ref No., Due Date, Branch, Requisition Type,
Item/Ledger Group, Item, Min Qty, Max Qty, Weight, Unit, Rate,
Pending Wt., CGST, SGST, IGST, VAT, Last Approved Rate, Last Supplier,
Broker, Total Amount, Status, Delivery Type, Open PO, Open PO No.
```

- [ ] **NEW Format Column Mapping**
  - Test: Column 0 → Date
  - Test: Column 11 → Weight (NEW only)
  - Test: Column 12 → Unit (shifted by 1)
  - Test: Column 13 → Rate (shifted by 1)
  - Test: Column 14 → Pending Wt. (NEW only)
  - Test: Column 15 → CGST (shifted by 2)
  - Test: Column 22 → Total Amount (shifted)
  - Test: All 28 fields map correctly

#### 1.4 Data Type Conversion Tests
- [ ] **Numeric Field Parsing**
  - Test: `"1000"` → `1000`
  - Test: `"1,000"` → `1000` (remove commas)
  - Test: `"1,000.50"` → `1000.5`
  - Test: `""` → `0` (empty numeric field)
  - Test: `"abc"` → `0` (invalid number)
  - Test: `"0.00"` → `0`
  - Test: Negative numbers: `"-100"` → `-100`

- [ ] **Tax Fields (CGST, SGST, IGST, VAT)**
  - Test: `"9.00"` → `9`
  - Test: `"0.00"` → `0`
  - Test: Empty field → `0`
  - Test: Multiple tax values in same row

- [ ] **Amount Fields**
  - Test: Total Amount = `"50,000.00"` → `50000`
  - Test: Rate = `"100.50"` → `100.5`
  - Test: Last Approved Rate parsing
  - Test: Very large amounts (>1,000,000)

#### 1.5 PO ID Generation Tests
- [ ] **Unique ID Generation**
  - Test: Format matches `PO-{timestamp}-{lineNumber}-{random}`
  - Test: IDs are unique across 10,000 rows
  - Test: Timestamp component is valid
  - Test: Line number component is sequential
  - Test: Random component varies

#### 1.6 Full CSV Parsing Integration Tests
- [ ] **Complete CSV File Tests**
  - Test: Parse 10-row sample OLD format → 10 POs
  - Test: Parse 10-row sample NEW format → 10 POs
  - Test: Parse 1,000-row CSV → 1,000 POs
  - Test: Parse 10,000-row CSV → 10,000 POs (performance)
  - Test: Empty CSV file → empty array
  - Test: Headers only → empty array

- [ ] **Data Integrity Verification**
  - Test: First row values match CSV exactly
  - Test: Last row values match CSV exactly
  - Test: Random middle row values match CSV
  - Test: All numeric fields are numbers (not strings)
  - Test: All date fields are valid Date objects
  - Test: All POs have `isApproved: false`
  - Test: All POs have `uploadedAt` timestamp

---

### 2. API Endpoint Tests

#### 2.1 GET `/api/pos?approved=true` (Get Approved POs)
- [ ] **Success Cases**
  - Test: Returns array of approved POs
  - Test: All returned POs have `isApproved: true`
  - Test: Ordered by `uploadedAt` DESC (newest first)
  - Test: Response format: `{ success: true, pos: [...] }`
  - Test: Empty array when no approved POs exist

- [ ] **Data Verification**
  - Test: All 26 fields present in each PO
  - Test: Date fields are strings (serialized)
  - Test: Numeric fields are numbers
  - Test: No data truncation

- [ ] **Error Cases**
  - Test: Database connection failure → 500 error
  - Test: Invalid query parameter → handled gracefully

#### 2.2 GET `/api/pos?approved=false` (Get Pending POs)
- [ ] **Success Cases**
  - Test: Returns array of pending POs
  - Test: All returned POs have `isApproved: false`
  - Test: Ordered by `uploadedAt` DESC
  - Test: Empty array when no pending POs exist

#### 2.3 POST `/api/pos` (Save POs)
- [ ] **Success Cases**
  - Test: Accept single PO array → returns count 1
  - Test: Accept 100 POs → returns count 100
  - Test: Accept 1,000 POs → returns count 1,000
  - Test: Response format: `{ success: true, count: N }`
  - Test: All POs inserted into database
  - Test: `skipDuplicates: true` works (duplicate ID rejected)

- [ ] **Data Integrity**
  - Test: All 26 fields saved to database
  - Test: Date fields stored as DateTime
  - Test: Numeric fields stored correctly
  - Test: String fields not truncated
  - Test: Special characters preserved
  - Test: Unicode characters preserved

- [ ] **Error Cases**
  - Test: Empty array → error or count 0
  - Test: Missing required fields → error
  - Test: Invalid data types → error
  - Test: Not an array → 400 error
  - Test: Database insertion failure → 500 error

#### 2.4 PUT `/api/pos` (Update POs)
- [ ] **Success Cases**
  - Test: Update single PO `isApproved` → returns count 1
  - Test: Update 10 POs → returns count 10
  - Test: Response format: `{ success: true, count: N }`
  - Test: Database record actually updated

- [ ] **Data Verification**
  - Test: Only specified fields updated (isApproved)
  - Test: Other fields remain unchanged
  - Test: Timestamp updated appropriately

- [ ] **Error Cases**
  - Test: Empty PO ID array → error
  - Test: Non-existent PO IDs → count 0
  - Test: Not an array → 400 error
  - Test: Missing updates object → error

#### 2.5 DELETE `/api/pos?ids=...` (Delete POs)
- [ ] **Success Cases**
  - Test: Delete single PO by ID → success
  - Test: Delete multiple POs (comma-separated) → success
  - Test: Response format: `{ success: true }`
  - Test: POs actually removed from database

- [ ] **Edge Cases**
  - Test: Non-existent IDs → still returns success
  - Test: Empty ID list → handled gracefully
  - Test: Malformed ID format → error or handled

#### 2.6 Authentication Tests (`/api/auth/*`)
- [ ] **POST `/api/auth/register`**
  - Test: Create new user → returns user object
  - Test: Password is hashed (bcrypt)
  - Test: Duplicate email → error
  - Test: Missing required fields → error

- [ ] **POST `/api/auth/login`**
  - Test: Valid credentials → returns user + token
  - Test: Invalid email → error
  - Test: Invalid password → error
  - Test: Missing credentials → error

- [ ] **GET `/api/auth/user`**
  - Test: Returns current user info
  - Test: Unauthorized request → error

---

### 3. Data Analysis Tests (`lib/analysis.ts`)

#### 3.1 Price Anomaly Detection (`checkPriceAnomalies`)
- [ ] **Calculation Tests**
  - Test: Current rate 150, historical avg 100 → 50% increase (CRITICAL)
  - Test: Current rate 140, historical avg 100 → 40% increase (HIGH)
  - Test: Current rate 125, historical avg 100 → 25% increase (MEDIUM)
  - Test: Current rate 110, historical avg 100 → 10% increase (no flag)
  - Test: Current rate 90, historical avg 100 → 10% decrease (no flag)

- [ ] **Historical Data Handling**
  - Test: No historical data → flag as "No historical data"
  - Test: Historical average = 0 → flag as issue
  - Test: Single historical record → calculate correctly

- [ ] **Item Matching**
  - Test: Exact item name match
  - Test: Case-insensitive matching
  - Test: Partial name match (if applicable)
  - Test: No match → flag as "new item"

#### 3.2 Duplicate Detection (`checkDuplicates`)
- [ ] **Duplicate Identification**
  - Test: Same orderNo + supplier + item → duplicate found
  - Test: Same orderNo, different supplier → not duplicate
  - Test: Same supplier + item, different orderNo → not duplicate
  - Test: Multiple duplicates (3+ identical) → all flagged

- [ ] **Duplicate Details**
  - Test: Returns array of duplicate PO IDs
  - Test: Includes count of duplicates
  - Test: Severity set to HIGH

#### 3.3 Supplier Pattern Analysis (`analyzeSupplierPatterns`)
- [ ] **Pattern Detection**
  - Test: Order value 2x average → flagged
  - Test: Order value 1.5x average → flagged
  - Test: Order value = average → not flagged
  - Test: Requires 5+ historical orders to analyze

- [ ] **Calculation Tests**
  - Test: Historical orders: [100, 100, 100], current: 300 → 200% above avg
  - Test: Supplier with 4 orders → skipped (insufficient data)
  - Test: New supplier → skipped

#### 3.4 Risk Identification (`identifyRisks`)
- [ ] **New Supplier Detection**
  - Test: Supplier not in approved history → flagged
  - Test: Supplier exists in approved history → not flagged

- [ ] **High Value Orders**
  - Test: Total amount > ₹500,000 → flagged
  - Test: Total amount = ₹500,000 → flagged
  - Test: Total amount < ₹500,000 → not flagged

- [ ] **Rate Increase Detection**
  - Test: Rate 11% higher than last approved → flagged
  - Test: Rate 10% higher → not flagged
  - Test: Rate lower than last approved → not flagged
  - Test: No last approved rate → skipped

#### 3.5 Full Analysis Integration (`analyzeOrders`)
- [ ] **Complete Analysis Pipeline**
  - Test: Run all checks on 100 POs
  - Test: Returns issues grouped by severity
  - Test: Issues sorted by severity (CRITICAL first)
  - Test: Each issue has proper structure:
    - `id`, `severity`, `message`, `poId`, `details`, `resolved`

---

### 4. Report Analytics Tests (`lib/report-analytics.ts`)

#### 4.1 Spend by Supplier (`analyzeSpendBySupplier`)
- [ ] **Aggregation Tests**
  - Test: Group by supplier name
  - Test: Sum total amounts per supplier
  - Test: Count orders per supplier
  - Test: Calculate average order value
  - Test: Result sorted by total spend DESC

- [ ] **Data Accuracy**
  - Test: 10 orders from Supplier A, total ₹100,000 → avg ₹10,000
  - Test: Multiple suppliers → each calculated correctly
  - Test: Single order → total = order amount

#### 4.2 Spend by Category (`analyzeSpendByCategory`)
- [ ] **Aggregation Tests**
  - Test: Group by itemLedgerGroup
  - Test: Sum totals per category
  - Test: Count orders per category
  - Test: Calculate average per category

#### 4.3 Spend Trends (`analyzeSpendTrend`)
- [ ] **Time-Series Tests**
  - Test: Group by day
  - Test: Group by week
  - Test: Group by month
  - Test: Group by year
  - Test: Sort chronologically (oldest first)

- [ ] **Calculation Tests**
  - Test: 5 orders on 2024-03-15 → single data point with sum
  - Test: Orders span multiple months → multiple data points
  - Test: Empty date field → handled gracefully

#### 4.4 Period Trends (`analyzePeriodTrends`)
- [ ] **Monthly Analysis**
  - Test: Calculate monthly totals
  - Test: Count orders per month
  - Test: Format: "January 2024", "February 2024", etc.

- [ ] **Quarterly Analysis**
  - Test: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
  - Test: Sum amounts per quarter
  - Test: Count orders per quarter

---

### 5. Database Integrity Tests

#### 5.1 Schema Validation
- [ ] **purchase_orders Table**
  - Test: All 26 columns exist
  - Test: Data types correct:
    - `id`: String
    - `date`, `dueDate`, `deliveryDate`, `uploadedAt`: DateTime
    - `minQty`, `maxQty`, `rate`, `cgst`, `sgst`, `igst`, `vat`, `lastApprovedRate`, `totalAmount`: Float
    - `isApproved`: Boolean
    - All others: String
  - Test: Primary key on `id`
  - Test: Index on `isApproved`
  - Test: Index on `supplier`
  - Test: Index on `date`

#### 5.2 Data Persistence
- [ ] **Insert Operations**
  - Test: Insert PO → query returns same PO
  - Test: All fields match inserted values
  - Test: Date precision maintained
  - Test: Numeric precision maintained (no rounding errors)

- [ ] **Update Operations**
  - Test: Update `isApproved` → reflects in query
  - Test: Update one field → others unchanged
  - Test: Timestamp updates appropriately

- [ ] **Delete Operations**
  - Test: Delete PO → query returns empty
  - Test: Delete multiple → all removed

#### 5.3 Data Constraints
- [ ] **Unique Constraints**
  - Test: Duplicate ID insertion fails
  - Test: `skipDuplicates` handles gracefully

- [ ] **Default Values**
  - Test: `isApproved` defaults to false
  - Test: `uploadedAt` auto-set on creation

---

## FRONTEND TESTING CHECKLIST

### 6. Component Tests

#### 6.1 CSVUploader Component (`components/csv-uploader.tsx`)
- [ ] **Render Tests**
  - Test: Component renders without errors
  - Test: Upload button visible
  - Test: Drag-and-drop area visible

- [ ] **File Upload Tests**
  - Test: Click upload button → file input opens
  - Test: Select .csv file → triggers upload
  - Test: Select .txt file → rejected
  - Test: Drag CSV file → drop zone highlights
  - Test: Drop CSV file → triggers upload

- [ ] **Upload Flow Tests**
  - Test: Upload starts → loading state shown
  - Test: Upload succeeds → success message shown
  - Test: Upload succeeds → calls `onUploadSuccess` callback
  - Test: Upload fails → error message shown
  - Test: No valid POs → error message shown

- [ ] **API Integration Tests**
  - Test: Calls `parseCSV()` with file content
  - Test: Calls `saveCurrentPOs()` with parsed POs
  - Test: Handles API errors gracefully

#### 6.2 POComparison Component (`components/po-comparison.tsx`)
- [ ] **Render Tests**
  - Test: Displays list of POs
  - Test: Displays analysis results
  - Test: Shows severity badges (CRITICAL, HIGH, MEDIUM)
  - Test: Empty state when no POs

- [ ] **Selection Tests**
  - Test: Click PO → checkbox selected
  - Test: Click again → checkbox unselected
  - Test: Select all → all POs selected
  - Test: Deselect all → all POs unselected

- [ ] **Approval Tests**
  - Test: Click approve button → calls API
  - Test: Approval succeeds → POs removed from list
  - Test: Approval succeeds → notification shown
  - Test: Approval fails → error message shown

- [ ] **Deletion Tests**
  - Test: Click delete → confirmation dialog
  - Test: Confirm delete → calls API
  - Test: Delete succeeds → POs removed
  - Test: Delete fails → error message

- [ ] **Analysis Display Tests**
  - Test: Issues grouped by severity
  - Test: Click issue → details panel opens
  - Test: Details panel shows PO info
  - Test: Mark as resolved → updates state

#### 6.3 DashboardOverview Component (`components/dashboard-overview.tsx`)
- [ ] **Render Tests**
  - Test: Displays total POs count
  - Test: Displays total amount
  - Test: Displays average order value
  - Test: Displays unique suppliers count
  - Test: Displays pending approvals count

- [ ] **Calculation Tests**
  - Test: Total amount = sum of all PO amounts
  - Test: Average = total amount / PO count
  - Test: Unique suppliers = distinct supplier names
  - Test: Pending count = POs with `isApproved: false`

- [ ] **Data Display Tests**
  - Test: Currency formatted correctly (₹)
  - Test: Large numbers formatted with commas
  - Test: Zero state handled gracefully

#### 6.4 TrendDashboard Component (`components/trend-dashboard.tsx`)
- [ ] **Render Tests**
  - Test: Renders charts with data
  - Test: Supplier spending chart displays
  - Test: Category spending chart displays
  - Test: Trend line chart displays

- [ ] **Chart Data Tests**
  - Test: Chart data matches PO data
  - Test: Colors assigned correctly
  - Test: Labels formatted correctly
  - Test: Tooltips show correct values

#### 6.5 NotificationBell Component (`components/notification-bell.tsx`)
- [ ] **Render Tests**
  - Test: Bell icon visible
  - Test: Badge shows count when notifications exist
  - Test: No badge when no notifications

- [ ] **Interaction Tests**
  - Test: Click bell → dropdown opens
  - Test: Notifications listed in dropdown
  - Test: Click notification → mark as read
  - Test: Click clear all → all notifications removed

---

### 7. Page Tests

#### 7.1 Upload Page (`app/upload/page.tsx`)
- [ ] **Initial Load Tests**
  - Test: Page renders without errors
  - Test: Calls `getCurrentPOs()` on mount
  - Test: Calls `getApprovedPOs()` on mount
  - Test: Loading state shown initially

- [ ] **Upload Flow Integration Tests**
  - Test: Upload CSV → POs appear in list
  - Test: Upload count matches parsed count
  - Test: Success notification appears
  - Test: New notification created via API

- [ ] **Approval Flow Integration Tests**
  - Test: Select POs → click approve → POs move to approved
  - Test: Approved POs appear in dashboard
  - Test: 'pos-approved' event dispatched
  - Test: Both lists refreshed after approval

- [ ] **Data Integrity Tests**
  - Test: Uploaded PO values match CSV exactly
  - Test: After approval, values unchanged
  - Test: Query approved POs → values match uploaded

#### 7.2 Dashboard Page (`app/page.tsx`)
- [ ] **Initial Load Tests**
  - Test: Fetches approved POs on mount
  - Test: Displays PO statistics
  - Test: Shows chart visualizations

- [ ] **Auto-Refresh Tests**
  - Test: Refreshes every 3 seconds
  - Test: Refreshes on window focus
  - Test: Listens to 'pos-approved' event
  - Test: Updates data when new POs approved

- [ ] **Data Display Tests**
  - Test: Stats reflect actual PO data
  - Test: Charts update when data changes
  - Test: Empty state when no approved POs

#### 7.3 Reports Page (`app/reports/page.tsx`)
- [ ] **Initial Load Tests**
  - Test: Fetches approved POs
  - Test: Runs analytics on POs
  - Test: Displays charts

- [ ] **Filter Tests**
  - Test: Filter by supplier → data updates
  - Test: Filter by category → data updates
  - Test: Filter by date range → data updates
  - Test: Clear filters → shows all data

- [ ] **Anomaly Detection Tests**
  - Test: Anomalies displayed with severity
  - Test: Click anomaly → details shown
  - Test: Mark as resolved → updates state

---

### 8. End-to-End Workflow Tests

#### 8.1 Complete Upload-to-Dashboard Flow
- [ ] **Full Workflow Test**
  1. Load sample CSV file (10 rows)
  2. Upload via CSVUploader
  3. Verify 10 POs appear in pending list
  4. Run analysis → verify issues detected
  5. Select all POs
  6. Click approve
  7. Navigate to dashboard
  8. Verify 10 POs appear in approved list
  9. Verify statistics updated correctly
  10. Verify all values match original CSV

- [ ] **Data Integrity Verification**
  - Test: Pick random PO from CSV
  - Test: Find same PO in database
  - Test: Compare all 26 fields → exact match
  - Test: Display PO on dashboard
  - Test: All fields still match CSV

#### 8.2 Multiple Upload Workflow
- [ ] **Sequential Uploads**
  - Test: Upload CSV A (10 POs)
  - Test: Upload CSV B (10 POs)
  - Test: Total 20 POs in pending
  - Test: Approve first 10
  - Test: Verify only first 10 in approved
  - Test: Approve second 10
  - Test: Verify all 20 in approved

#### 8.3 Error Recovery Workflow
- [ ] **Network Failure Recovery**
  - Test: Upload CSV → network fails
  - Test: Retry upload → succeeds
  - Test: No duplicate POs created

- [ ] **Partial Approval Failure**
  - Test: Select 10 POs for approval
  - Test: API fails for 5 POs
  - Test: Verify only 5 approved
  - Test: Retry failed 5 → all 10 approved

---

### 9. Edge Case Tests

#### 9.1 CSV Edge Cases
- [ ] **File Size Tests**
  - Test: 1 KB file → parses quickly
  - Test: 1 MB file → parses within 5 seconds
  - Test: 10 MB file → parses within 30 seconds
  - Test: 100 MB file → error or timeout handled

- [ ] **Data Edge Cases**
  - Test: All fields empty → handled gracefully
  - Test: Only required fields populated
  - Test: Extremely long strings (1000+ chars)
  - Test: Special characters: `&`, `<`, `>`, `"`, `'`
  - Test: Unicode: Chinese, Arabic, Emoji
  - Test: SQL injection attempts in strings
  - Test: HTML/JavaScript in strings (XSS prevention)

- [ ] **Numeric Edge Cases**
  - Test: Very large amounts (1,000,000,000)
  - Test: Very small amounts (0.01)
  - Test: Negative quantities
  - Test: Negative amounts
  - Test: Zero values
  - Test: Scientific notation (1e6)

#### 9.2 Concurrent Operations
- [ ] **Race Condition Tests**
  - Test: Upload while approval in progress
  - Test: Approve same POs from two tabs simultaneously
  - Test: Delete while fetching POs
  - Test: Multiple rapid uploads

#### 9.3 Browser/Network Edge Cases
- [ ] **Browser Tests**
  - Test: Page refresh during upload
  - Test: Browser back button during approval
  - Test: Close tab during API call
  - Test: Browser cache clearing

- [ ] **Network Tests**
  - Test: Slow connection (throttled)
  - Test: Intermittent connection drops
  - Test: Request timeout (>30 seconds)
  - Test: 500 server errors

---

### 10. Performance Tests

#### 10.1 CSV Parsing Performance
- [ ] **Benchmark Tests**
  - Test: 100 rows → <500ms
  - Test: 1,000 rows → <2 seconds
  - Test: 10,000 rows → <10 seconds
  - Test: Memory usage stays under 500 MB

#### 10.2 API Performance
- [ ] **Endpoint Benchmarks**
  - Test: Save 100 POs → <1 second
  - Test: Save 1,000 POs → <5 seconds
  - Test: Fetch 1,000 POs → <2 seconds
  - Test: Update 100 POs → <1 second

#### 10.3 Frontend Performance
- [ ] **Rendering Benchmarks**
  - Test: Render 100 POs in list → <1 second
  - Test: Render 1,000 POs → <3 seconds
  - Test: Chart rendering with 1,000 data points → <2 seconds
  - Test: Dashboard refresh → <1 second

---

### 11. Security Tests

#### 11.1 Input Validation
- [ ] **CSV Injection Prevention**
  - Test: CSV with `=cmd|'/c calc'` → sanitized
  - Test: CSV with formulas → treated as text
  - Test: CSV with scripts → escaped

- [ ] **SQL Injection Prevention**
  - Test: Supplier name: `'; DROP TABLE purchase_orders; --`
  - Test: Prisma automatically escapes (verify)

- [ ] **XSS Prevention**
  - Test: Item name: `<script>alert('XSS')</script>`
  - Test: Displayed on page → escaped
  - Test: No script execution

#### 11.2 Authentication & Authorization
- [ ] **Protected Routes**
  - Test: Access `/upload` without login → redirect
  - Test: Access `/api/pos` without auth → 401 error
  - Test: Access other user's POs → forbidden

- [ ] **Password Security**
  - Test: Passwords hashed in database (bcrypt)
  - Test: Plain text passwords never logged
  - Test: Password in responses → redacted

---

### 12. Browser Compatibility Tests

- [ ] **Chrome (latest)** - All features work
- [ ] **Firefox (latest)** - All features work
- [ ] **Safari (latest)** - All features work
- [ ] **Edge (latest)** - All features work
- [ ] **Mobile Safari (iOS)** - Responsive, touch works
- [ ] **Chrome Mobile (Android)** - Responsive, touch works

---

## Test Execution Plan

### Priority Levels

#### P0 - Critical (Must Pass Before Release)
1. CSV parsing with data integrity
2. POST /api/pos (save POs)
3. GET /api/pos (fetch POs)
4. Upload flow end-to-end
5. Approval flow end-to-end
6. Dashboard data accuracy

#### P1 - High (Should Pass Before Release)
1. PUT /api/pos (update POs)
2. DELETE /api/pos (remove POs)
3. Data analysis functions
4. Report analytics
5. Error handling
6. Security tests

#### P2 - Medium (Can Fix Post-Release)
1. Performance benchmarks
2. Edge cases
3. Browser compatibility
4. Concurrent operations

#### P3 - Low (Nice to Have)
1. UI polish tests
2. Animation tests
3. Accessibility tests

---

## Test Data Requirements

### Sample CSV Files Needed
1. **sample-old-format.csv** - 10 rows, OLD format
2. **sample-new-format.csv** - 10 rows, NEW format
3. **sample-large.csv** - 1,000 rows
4. **sample-edge-cases.csv** - Various edge cases
5. **sample-invalid.csv** - Invalid dates, malformed data
6. **sample-unicode.csv** - Special characters
7. **sample-duplicates.csv** - Contains duplicate orders

### Database Test Data
- 100 approved POs (for historical comparison)
- 50 pending POs (for approval testing)
- Multiple suppliers with varying order volumes
- Date range spanning 6+ months

---

## Testing Tools & Commands

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- csv-parser.test.ts
npm test -- api-pos.test.ts
npm test -- upload-page.test.tsx
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

---

## Success Criteria

### Coverage Targets
- **Backend**: 80% code coverage
- **Frontend**: 70% code coverage
- **CSV Parser**: 95% code coverage (critical)
- **API Endpoints**: 90% code coverage (critical)

### Critical Path Verification
- [ ] Upload CSV → All values in database exactly match CSV
- [ ] Approve POs → All values on dashboard exactly match CSV
- [ ] Run reports → All calculations based on correct CSV values
- [ ] No data loss at any stage
- [ ] No data corruption at any stage

---

## Continuous Integration

### Pre-Commit Checks
- Run unit tests
- Run linter
- Check TypeScript types

### Pre-Push Checks
- Run all tests
- Check coverage thresholds
- Run E2E tests

### CI Pipeline
1. Install dependencies
2. Run linter
3. Run type checks
4. Run unit tests
5. Run integration tests
6. Run E2E tests
7. Generate coverage report
8. Upload coverage to monitoring tool

---

## Test Maintenance

### When to Update Tests
- Adding new CSV columns
- Changing data formats
- Adding new API endpoints
- Modifying analysis algorithms
- Changing database schema

### Test Review Schedule
- Weekly: Review failing tests
- Monthly: Review test coverage
- Quarterly: Audit test quality
- Yearly: Major test refactoring

---

## Conclusion

This testing guide ensures **data integrity** throughout the entire PO-APP application lifecycle. By following this checklist, you can confidently verify that every value from the uploaded CSV file is accurately preserved, processed, and displayed across all features of the application.

**Remember:** The goal is not just to test that code runs, but to verify that **data remains accurate** from CSV upload through database storage to final display on the frontend.
