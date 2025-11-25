# Complete Test File Structure

This document shows all test files needed based on `TESTING_GUIDE.md`.

**📌 All tests are now organized in the `__tests__/` folder at the root level.**

---

## 📁 Centralized Test Structure

All test files are located in `__tests__/` folder, organized by feature/domain:

```
__tests__/
├── lib/                          # Library function tests
│   ├── csv-parser.test.ts        ✅ (Section 1) - CSV Parsing & Data Integrity
│   ├── analysis.test.ts          ✅ (Section 3) - Data Analysis Tests
│   ├── report-analytics.test.ts  ⬜ (Section 4) - Report Analytics Tests
│   ├── storage.test.ts           ⬜ (Helper) - Storage utility tests
│   ├── auth.test.ts              ⬜ (Helper) - Auth utility tests
│   └── jest-setup.test.ts        ✅ Jest configuration test
│
├── api/                          # API endpoint tests
│   ├── pos/
│   │   └── route.test.ts         ✅ (Section 2.1-2.5) - All POS API endpoints
│   ├── auth/
│   │   ├── register/
│   │   │   └── route.test.ts     ⬜ (Section 2.6) - Registration endpoint
│   │   ├── login/
│   │   │   └── route.test.ts     ⬜ (Section 2.6) - Login endpoint
│   │   └── user/
│   │       └── route.test.ts     ⬜ (Section 2.6) - User info endpoint
│   ├── analyze/
│   │   └── route.test.ts         ⬜ (Section 3) - Analysis API endpoint
│   └── notifications/
│       └── route.test.ts         ⬜ (Helper) - Notifications API
│
├── components/                   # React component tests
│   ├── csv-uploader.test.tsx     ✅ (Section 6.1) - CSV Uploader Component
│   ├── po-comparison.test.tsx    ✅ (Section 6.2) - PO Comparison Component
│   ├── dashboard-overview.test.tsx ✅ (Section 6.3) - Dashboard Overview Component
│   ├── trend-dashboard.test.tsx ⬜ (Section 6.4) - Trend Dashboard Component
│   ├── notification-bell.test.tsx ⬜ (Section 6.5) - Notification Bell Component
│   ├── dashboard-stats.test.tsx ⬜ (Helper) - Dashboard Stats Component
│   ├── report-viewer.test.tsx   ⬜ (Helper) - Report Viewer Component
│   └── branch-filter.test.tsx   ⬜ (Helper) - Branch Filter Component
│
├── app/                          # Next.js page tests
│   ├── upload/
│   │   └── page.test.tsx         ✅ (Section 7.1) - Upload Page
│   ├── page.test.tsx             ✅ (Section 7.2) - Dashboard Page (Home)
│   └── reports/
│       └── page.test.tsx         ⬜ (Section 7.3) - Reports Page
│
├── database/                     # Database tests
│   └── integrity.test.ts         ⬜ (Section 5) - Database Integrity Tests
│
├── e2e/                          # End-to-end tests
│   ├── upload-to-dashboard.test.tsx ⬜ (Section 8.1) - Complete workflow
│   ├── multiple-upload.test.ts   ⬜ (Section 8.2) - Multiple uploads
│   └── error-recovery.test.ts    ⬜ (Section 8.3) - Error recovery
│
├── edge-cases/                   # Edge case tests
│   ├── csv-edge-cases.test.ts    ⬜ (Section 9.1) - CSV edge cases
│   ├── concurrent-ops.test.ts    ⬜ (Section 9.2) - Concurrent operations
│   └── browser-network.test.ts   ⬜ (Section 9.3) - Browser/Network tests
│
├── performance/                  # Performance tests
│   ├── csv-parsing-perf.test.ts  ⬜ (Section 10.1) - CSV performance
│   ├── api-perf.test.ts          ⬜ (Section 10.2) - API performance
│   └── frontend-perf.test.ts     ⬜ (Section 10.3) - Frontend performance
│
└── security/                     # Security tests
    ├── input-validation.test.ts  ⬜ (Section 11.1) - Input validation
    └── auth-security.test.ts     ⬜ (Section 11.2) - Auth & authorization
```

---

## 📊 Test File Summary

### Backend Tests (Priority Order)

| File | Section | Priority | Status |
|------|---------|----------|--------|
| `__tests__/lib/csv-parser.test.ts` | 1 | P0 | ✅ Created |
| `__tests__/api/pos/route.test.ts` | 2.1-2.5 | P0 | ✅ Created |
| `__tests__/api/auth/*/route.test.ts` | 2.6 | P1 | ⬜ TODO |
| `__tests__/lib/analysis.test.ts` | 3 | P1 | ✅ Created |
| `__tests__/lib/report-analytics.test.ts` | 4 | P1 | ⬜ TODO |
| `__tests__/database/integrity.test.ts` | 5 | P1 | ⬜ TODO |

### Frontend Tests (Priority Order)

| File | Section | Priority | Status |
|------|---------|----------|--------|
| `__tests__/components/csv-uploader.test.tsx` | 6.1 | P0 | ✅ Created |
| `__tests__/components/po-comparison.test.tsx` | 6.2 | P0 | ✅ Created |
| `__tests__/components/dashboard-overview.test.tsx` | 6.3 | P0 | ✅ Created |
| `__tests__/app/upload/page.test.tsx` | 7.1 | P0 | ✅ Created |
| `__tests__/app/page.test.tsx` | 7.2 | P0 | ✅ Created |
| `__tests__/e2e/upload-to-dashboard.test.tsx` | 8.1 | P0 | ✅ Created |

### Additional Tests

| File | Section | Priority | Status |
|------|---------|----------|--------|
| `__tests__/edge-cases/*.test.ts` | 9 | P2 | ⬜ TODO |
| `__tests__/performance/*.test.ts` | 10 | P2 | ⬜ TODO |
| `__tests__/security/*.test.ts` | 11 | P1 | ⬜ TODO |

---

## 📝 Notes

- ✅ = Created/Completed
- ⬜ = TODO/Not Started
- **All test files are now centralized in `__tests__/` folder**
- Follow the naming convention: `*.test.ts` or `*.test.tsx`
- Each test file should map to sections in `TESTING_GUIDE.md`
- Import paths: Use relative paths from `__tests__/` to source files (e.g., `../../lib/csv-parser`)

---

## 🎯 Benefits of This Structure

1. **Centralized Organization**: All tests in one place, easy to find and manage
2. **Clear Separation**: Tests are separate from source code, keeping the codebase clean
3. **Scalable**: Easy to add new test categories as the project grows
4. **Standard Convention**: Follows common testing patterns used in many projects
5. **Easy to Exclude**: Simple to exclude from builds and deployments

---

## 🚀 Quick Start

1. Start with `__tests__/lib/csv-parser.test.ts` (already created)
2. Move to `__tests__/api/pos/route.test.ts` next
3. Follow the priority order (P0 → P1 → P2)
4. Check off items in `TESTING_GUIDE.md` as you complete them

---

## 📖 Import Path Examples

When writing tests in `__tests__/`, use relative paths to import source files:

```typescript
// From __tests__/lib/csv-parser.test.ts
import { parseDate, parseCSV } from '../../lib/csv-parser'

// From __tests__/api/pos/route.test.ts
import { GET, POST } from '../../../app/api/pos/route'

// From __tests__/components/csv-uploader.test.tsx
import { CSVUploader } from '../../components/csv-uploader'
```
