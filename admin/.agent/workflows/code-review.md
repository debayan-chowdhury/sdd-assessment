# Next.js Code Review Workflow

Please act as a Senior Next.js Technical Lead and review the provided code.
Do not rewrite the entire file immediately. Instead, analyze the code and
provide constructive feedback categorized under the following headers:

## 1. Security Vulnerabilities
Identify any risks such as unvalidated input reaching a Server Action or
Route Handler, secrets accidentally exposed to the client (a non-
`NEXT_PUBLIC_` env var passed into a Client Component, or logged/returned in
a response), missing auth checks inside a Server Action or Route Handler,
unsanitized input passed to `dangerouslySetInnerHTML`, or SSRF-style risk
from server-side fetches built from user-controlled URLs.

## 2. Performance Bottlenecks
Highlight any client-side `useEffect` + `fetch` data-fetching waterfall that
should be a Server Component fetch, sequential `await`s that could run in
parallel with `Promise.all`, unnecessary `'use client'` boundaries pulling
large dependencies into the browser bundle, missing `<Suspense>`/
`loading.tsx` around slow data, raw `<img>` tags that should use
`next/image`, or fetches missing deliberate cache/`revalidate` configuration.

## 3. Reliability & Error Handling
Check that Route Handlers wrap external calls in `try/catch` and return the
project's standard `{ error: { code, message } }` shape with correct status
codes, that route segments have `error.tsx`/`loading.tsx` coverage where
appropriate, and that expected failure cases (validation errors, not-found
results) are handled as typed results rather than thrown exceptions.

## 4. Maintainability
Point out overly complex or oversized components, Server/Client boundary
misplaced too high in the tree, prop drilling that should be composition,
tight coupling between UI and data-fetching logic, or violations of the
DRY (Don't Repeat Yourself) principle. Suggest better naming conventions
if applicable.

After providing your analysis, offer specific, isolated code snippets
showing how to fix the most critical issues you found.
