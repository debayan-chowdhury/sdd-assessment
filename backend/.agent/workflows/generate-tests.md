# Unit Test Generation Workflow

Please generate unit tests for the provided Node.js code. You must adhere to
the following testing standards:

* **Framework:** Assume we are using Jest as our primary testing framework.
* **Coverage:** Write tests covering the "happy path", expected failure
  scenarios (validation errors, not-found documents, unauthorized access),
  and edge cases (empty arrays, missing optional fields, malformed
  ObjectIds).
* **Mocking:** Mock all external dependencies, including Mongoose model
  calls, third-party API requests, and file system operations, using Jest's
  mocking utilities (`jest.mock()`, `jest.spyOn()`). Do not hit a real
  database in a unit test — use an in-memory/mocked model layer.
* **Assertions:** Write clear and descriptive assertions. Ensure that error
  cases assert the specific error message/status code thrown, not just a
  generic failure.
* **Structure:** Group related tests using `describe` blocks and use `it`
  blocks for individual test cases. Follow the Arrange-Act-Assert pattern.

Output the complete test file code so it can be copied directly into the
project.
