# N8N GetStream Chat Node - AI Coding Instructions

## Project Architecture

This is an **N8N community node** for GetStream Chat server-side operations. The architecture follows N8N's plugin pattern with strict separation between credentials, node logic, and helper functions.

### Core Components
- **`nodes/StreamChat/StreamChat.node.ts`**: Main node implementation with 4 resources (user, channel, message, moderation) and 20+ operations
- **`credentials/StreamChatApi.credentials.ts`**: Secure credential management for Stream Chat API key/secret
- **`nodes/StreamChat/helpers.ts`**: Shared `getServerClient()` function for Stream Chat SDK initialization
- **`tests/`**: Comprehensive Jest test suite with 40+ tests covering all components

### N8N Node Pattern
All operations follow this structure:
```typescript
// Parameter definition in `properties` array
{ displayName: 'User ID', name: 'userId', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['generateToken'] } } }

// Execution in `execute()` method  
const userId = this.getNodeParameter('userId', i) as string;
const client = await getServerClient.call(this);
result = client.createToken(userId);
```

## Critical Development Workflows

### Build & Test Commands
```bash
npm run build          # TypeScript compilation + icon copying (required before testing changes)
npm test              # Run full Jest suite (40 tests, ~3s)
npm run test:coverage # Generate coverage reports
npm run dev           # TypeScript watch mode for development
```

### N8N Integration Testing
```bash
npm link                              # In project root
cd ~/.n8n/nodes && npm link n8n-nodes-getstream  # Link to N8N instance
```

### TypeScript Configuration
- **`tsconfig.json`**: Main build config with strict settings and CommonJS output
- **`tsconfig.test.json`**: Test-specific config allowing synthetic imports for Jest
- **`jest.config.js`**: Uses ts-jest with custom test config and comprehensive mocking

## Project-Specific Patterns

### Parameter Display Logic
Uses N8N's `displayOptions.show` pattern for conditional parameter visibility:
```typescript
displayOptions: { show: { resource: ['moderation'], operation: ['banUser', 'shadowBan'] } }
```

### Error Handling Pattern
All operations wrapped in try-catch with N8N's `continueOnFail` pattern:
```typescript
try {
  result = await client.someOperation();
} catch (error) {
  if (this.continueOnFail()) {
    return [{ json: { error: error.message } }];
  }
  throw new NodeApiError(this.getNode(), error);
}
```

### Stream Chat SDK Integration
- **Server-side only**: Uses `StreamChat.getInstance(apiKey, apiSecret)` pattern
- **Channel operations**: Always use `client.channel(type, id)` format where CID = "type:id"
- **Bulk operations**: Prefer SDK's bulk methods (`upsertUsers`, `queryChannels`) over loops

### Testing Approach
- **Complete SDK mocking**: `tests/setup.ts` provides comprehensive Stream Chat SDK mocks
- **Four test categories**: Credentials, helpers, node unit tests, integration tests
- **Parameter validation**: Tests focus on N8N parameter handling, not Stream Chat API behavior
- **Coverage targeting**: Focuses on node logic, not external SDK calls

## Integration Points

### N8N Framework Dependencies
- `IExecuteFunctions`: Core execution context with `getNodeParameter()`, `getCredentials()`
- `INodeTypeDescription`: Node metadata including parameters, credentials, display options
- `NodeApiError`: Standard error type for N8N operations

### Stream Chat SDK Boundaries  
- Authentication handled in `helpers.ts` with credential validation
- All moderation operations use server-side SDK methods (ban, mute, flag, query)
- Channel CID format strictly enforced: "messaging:general", "team:developers"

### Build System Components
- **Gulp**: Copies SVG icons from `nodes/` to `dist/` (essential for N8N node appearance)
- **TypeScript**: CommonJS output required for N8N compatibility
- **ESLint**: Uses `eslint-plugin-n8n-nodes-base` for N8N-specific rules

## Common Gotchas

1. **Icon copying**: Always run `npm run build` (not just `tsc`) to copy icons to dist/
2. **Channel CID format**: Must be "type:id" (e.g., "messaging:general"), not just "general"
3. **Credential security**: API secret marked as password field, never expose client-side
4. **Parameter types**: Use `as string` casting with `getNodeParameter()` for TypeScript safety
5. **Test mocking**: Update `tests/setup.ts` when adding new Stream Chat SDK methods
6. **N8N linking**: Remember to re-link after major changes for local testing

When adding new operations, follow the existing parameter → execution → test pattern and ensure proper conditional display logic for parameter organization.
