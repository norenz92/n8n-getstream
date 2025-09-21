# GetStream Chat N8N Node - Basic Usage Examples

## Prerequisites

1. GetStream Chat account with API credentials
2. N8N instance with the GetStream Chat node installed
3. Configured Stream Chat API credentials in N8N

## Example Workflows

### 1. User Token Generation Flow

**Use Case**: Generate authentication tokens for users during login/registration

**Workflow Steps**:
1. **Trigger**: HTTP Request or Database operation
2. **GetStream Node**: Generate Token
   - Resource: User
   - Operation: Generate Token
   - User ID: `{{$json["userId"]}}`

**Expected Output**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. User Onboarding Flow

**Use Case**: Create users and set up initial channels

**Workflow Steps**:
1. **Trigger**: New user registration
2. **GetStream Node 1**: Upsert User
   - Resource: User
   - Operation: Upsert
   - User ID: `{{$json["userId"]}}`
   - User Data: `{"name": "{{$json["name"]}}", "role": "user"}`

3. **GetStream Node 2**: Create Welcome Channel
   - Resource: Channel
   - Operation: Create
   - Channel Type: `messaging`
   - Channel ID: `welcome-{{$json["userId"]}}`
   - Members: `{{$json["userId"]}},admin`

### 3. Message Broadcasting Flow

**Use Case**: Send system messages or notifications

**Workflow Steps**:
1. **Trigger**: System event or scheduled trigger
2. **GetStream Node**: Send Message
   - Resource: Message
   - Operation: Send
   - Channel CID: `messaging:announcements`
   - Message Text: `System maintenance scheduled for tonight`
   - User ID (Sender): `system`

### 4. User Management Flow

**Use Case**: Bulk user operations and queries

**Workflow Steps**:
1. **Database Query**: Get users to update
2. **Code Node**: Transform data to GetStream format
```javascript
const users = items.map(item => ({
  id: item.json.user_id,
  name: item.json.full_name,
  email: item.json.email,
  role: item.json.is_admin ? 'admin' : 'user'
}));

return [{ json: { users } }];
```
3. **GetStream Node**: Upsert Multiple Users
   - Resource: User
   - Operation: Upsert Multiple
   - Users Data: `{{$json["users"]}}`

### 5. Moderation Flow

**Use Case**: Automated content moderation

**Workflow Steps**:
1. **Trigger**: Webhook from GetStream (message.new)
2. **Content Moderation API**: Check message content
3. **IF Node**: Check if content violates policy
4. **GetStream Node 1**: Delete Message (if violation)
   - Resource: Message
   - Operation: Delete
   - Message ID: `{{$json["message"]["id"]}}`

5. **GetStream Node 2**: Ban User (if severe violation)
   - Resource: Moderation
   - Operation: Ban User
   - Target User ID: `{{$json["message"]["user"]["id"]}}`
   - Reason: `Inappropriate content`
   - Timeout: `60`

### 6. Channel Management Flow

**Use Case**: Dynamic channel creation and member management

**Workflow Steps**:
1. **Trigger**: Project creation event
2. **GetStream Node 1**: Create Project Channel
   - Resource: Channel
   - Operation: Create
   - Channel Type: `messaging`
   - Channel ID: `project-{{$json["projectId"]}}`
   - Members: `{{$json["teamMembers"].join(",")}}`

3. **GetStream Node 2**: Add Moderators
   - Resource: Channel
   - Operation: Add Moderators
   - Channel Type: `messaging`
   - Channel ID: `project-{{$json["projectId"]}}`
   - Members: `{{$json["projectManagers"].join(",")}}`

## Testing Tips

### 1. Use HTTP Request Node for Testing
Create a simple HTTP endpoint to trigger your workflows:
```json
{
  "userId": "test-user-123",
  "name": "Test User",
  "email": "test@example.com"
}
```

### 2. Debug with Set Node
Add Set nodes after GetStream operations to see the exact response:
- Add all fields from the GetStream response
- Use expressions like `{{$json}}`

### 3. Error Handling
- Enable "Continue on Fail" for non-critical operations
- Use IF nodes to check for successful responses
- Add error notifications for critical failures

### 4. Channel CID Format
Always use the format `type:id` for Channel CID:
- ✅ `messaging:general`
- ✅ `livestream:event-123`
- ❌ `general` (missing type)

### 5. User ID Consistency
Ensure user IDs are consistent across your application:
- Use the same ID format everywhere
- Consider using UUIDs for uniqueness
- Don't use special characters in user IDs

## Common Pitfalls

1. **Forgetting to await operations**: GetStream operations are async
2. **Incorrect Channel CID format**: Must be `type:id`
3. **Missing user_id in messages**: Required for sendMessage operation
4. **Using client credentials server-side**: Always use API secret for server operations
5. **Not handling rate limits**: GetStream has API rate limits

## Production Considerations

1. **Error Handling**: Always implement proper error handling
2. **Rate Limiting**: Be aware of API rate limits
3. **Credential Security**: Never expose API secrets
4. **Monitoring**: Set up monitoring for critical workflows
5. **Testing**: Test all workflows thoroughly before production deployment
