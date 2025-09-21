# Testing Documentation

This project uses Jest for comprehensive testing of the N8N GetStream Chat addon.

## Test Structure

```
tests/
├── credentials/          # Credential validation tests
├── nodes/               # Node functionality tests
├── setup.ts            # Jest configuration and mocks
└── README.md           # This file
```

## Test Categories

### 1. Credentials Tests (`StreamChatApi.credentials.test.ts`)
- Validates credential configuration
- Tests required fields and types
- Ensures proper security settings (password fields)

### 2. Helpers Tests (`StreamChat.helpers.test.ts`)
- Tests the `getServerClient` function
- Validates credential handling
- Tests error scenarios and edge cases

### 3. Node Unit Tests (`StreamChat.node.test.ts`)
- Tests individual operations (user, channel, message)
- Validates parameter handling
- Tests error handling with `continueOnFail`
- Mocks Stream Chat API responses

### 4. Integration Tests (`StreamChat.integration.test.ts`)
- Tests node configuration and structure
- Validates parameter definitions
- Tests conditional parameter display
- Ensures proper type definitions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Current coverage:
- **Credentials**: 100% coverage
- **Helpers**: 100% coverage  
- **Node**: ~32% coverage (extensive operations, limited test scenarios)
- **Overall**: ~35% coverage

## Key Test Features

### Mocking
- Stream Chat SDK is fully mocked for consistent testing
- N8N execution context is properly mocked
- Async operations are handled correctly

### Error Scenarios
- API errors with and without `continueOnFail`
- Invalid JSON parameter handling
- Missing credential scenarios
- Network/connection failures

### Parameter Validation
- JSON parsing for complex parameters
- Member list parsing and filtering
- Type validation (string, number, boolean)
- Conditional parameter display

## Adding New Tests

When adding new operations or features:

1. **Update Mocks**: Add new methods to the `mockClient` in test setup
2. **Unit Tests**: Create specific test cases for new operations
3. **Integration Tests**: Update parameter validation tests
4. **Error Handling**: Test failure scenarios for new operations

## Best Practices

- Use descriptive test names that explain the scenario
- Group related tests with `describe` blocks
- Test both success and failure paths
- Mock external dependencies completely
- Validate both inputs and outputs
- Keep tests independent and repeatable
