

## Plan: Remove debug code from Dashboard.tsx

**Summary:** Clean up all RLS debug instrumentation from the Dashboard page. The `useSearchParams` import stays because it's used for the invite deep link (line 79).

### Changes (single file: `src/pages/Dashboard.tsx`)

1. **Remove line 44** — `const showDebug = ...`
2. **Remove lines 46-53** — `debugInfo` state and its type
3. **Remove lines 55-75** — the `useEffect` that calls `debug_request_context`
4. **Remove lines 138-153** — the debug panel JSX block

No other files or logic affected.

