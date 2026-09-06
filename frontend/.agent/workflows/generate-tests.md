# Unit Test Generation Workflow

Please generate unit tests for the provided Next.js/React/TypeScript code.
You must adhere to the following testing standards:

* **Framework:** Assume we are using Vitest as our test runner, with React
  Testing Library (`@testing-library/react`) for component tests.
* **Coverage:** Write tests covering the "happy path", expected failure
  scenarios, and edge cases (empty/null props, boundary values, loading and
  error states).
* **Mocking:** Mock all external dependencies — `fetch`/API calls, Next.js
  navigation hooks (`next/navigation`'s `useRouter`, `usePathname`,
  `useSearchParams`), and any third-party modules — using Vitest's `vi.fn()`
  and `vi.mock()` utilities. Never let a test hit a real network or
  filesystem resource.
* **Client vs Server:** For a `"use client"` component, render it with
  React Testing Library and assert on user-visible behavior (rendered
  text, ARIA roles, interaction outcomes via `@testing-library/user-event`)
  rather than implementation details. For a Server Component or Route
  Handler, test the exported function directly (call it with representative
  args/`Request` objects and assert on its return value/response) rather
  than trying to render it.
* **Assertions:** Write clear and descriptive assertions. Ensure error-case
  tests assert on the specific error/message thrown, not just a generic
  failure.
* **Structure:** Group related tests using `describe` blocks and use `it`
  blocks for individual test cases. Follow the Arrange-Act-Assert pattern.

Output the complete test file code so it can be copied directly into the
project.
