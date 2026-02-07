// Increase the default timeout for all tests
jest.setTimeout(120000); // 2 minutes

// Clean up any remaining handles
afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for cleanup
});
