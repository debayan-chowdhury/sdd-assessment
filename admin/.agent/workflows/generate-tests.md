# Unit Test Generation Workflow

Please generate unit tests for the provided Next.js/TypeScript code. You must
adhere to the following testing standards:

* **Framework:** Assume we are using Vitest as our test runner, with React
  Testing Library (`@testing-library/react`) for rendering and interacting
  with components, and `@testing-library/jest-dom` matchers for assertions.
* **Coverage:** Write tests covering the "happy path", expected failure
  scenarios (validation errors, rejected promises, not-found states), and
  edge cases (empty lists, boundary values, loading/error UI states).
* **Mocking:** Mock all external dependencies — `fetch` calls, database or
  API clients, and Next.js navigation hooks (`next/navigation`'s
  `useRouter`/`useSearchParams`/`usePathname`) — using Vitest's `vi.fn()` /
  `vi.mock()` utilities. Never let a unit test make a real network call.
* **Server vs. Client code:** For a Server Component or Server Action, test
  the exported function directly as an async function and assert on its
  return value or thrown error. For a Client Component, render it with
  React Testing Library and assert on rendered output and user interaction
  via `@testing-library/user-event`.
* **Assertions:** Write clear and descriptive assertions. Ensure error-path
  tests assert on the specific error message/shape thrown or returned, not
  just a generic failure.
* **Structure:** Group related tests using `describe` blocks and use `it`
  blocks for individual test cases. Follow the Arrange-Act-Assert pattern.

Output the complete test file code (including necessary imports and mocks)
so it can be copied directly into the project as `*.test.tsx` /
`*.test.ts` alongside the file under test.
