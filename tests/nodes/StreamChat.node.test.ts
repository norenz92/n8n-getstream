import { StreamChat } from '../../nodes/StreamChat/StreamChat.node';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock the helpers module
jest.mock('../../nodes/StreamChat/helpers');

describe('StreamChat Node', () => {
	let streamChatNode: StreamChat;
	let mockExecuteFunctions: IExecuteFunctions;
	let mockClient: any;

	beforeEach(() => {
		streamChatNode = new StreamChat();
		
		mockClient = {
			connectUser: jest.fn().mockResolvedValue({}),
			disconnectUser: jest.fn().mockResolvedValue({}),
			createToken: jest.fn().mockReturnValue('token'),
			upsertUser: jest.fn().mockResolvedValue({}),
			upsertUsers: jest.fn().mockResolvedValue({}),
			queryUsers: jest.fn().mockResolvedValue({}),
			createUser: jest.fn().mockResolvedValue({}),
			updateUser: jest.fn().mockResolvedValue({}),
			deleteUser: jest.fn().mockResolvedValue({}),
			deactivateUser: jest.fn().mockResolvedValue({}),
			reactivateUser: jest.fn().mockResolvedValue({}),
			banUser: jest.fn().mockResolvedValue({}),
			unbanUser: jest.fn().mockResolvedValue({}),
			muteUser: jest.fn().mockResolvedValue({}),
			unmuteUser: jest.fn().mockResolvedValue({}),
			flagUser: jest.fn().mockResolvedValue({}),
			unflagUser: jest.fn().mockResolvedValue({}),
			queryChannels: jest.fn().mockResolvedValue({}),
			getMessage: jest.fn().mockResolvedValue({}),
			updateMessage: jest.fn().mockResolvedValue({}),
			deleteMessage: jest.fn().mockResolvedValue({}),
			search: jest.fn().mockResolvedValue({}),
			channel: jest.fn().mockReturnValue({
				create: jest.fn().mockResolvedValue({}),
				update: jest.fn().mockResolvedValue({}),
				delete: jest.fn().mockResolvedValue({}),
				truncate: jest.fn().mockResolvedValue({}),
				watch: jest.fn().mockResolvedValue({}),
				stopWatching: jest.fn().mockResolvedValue({}),
				addMembers: jest.fn().mockResolvedValue({}),
				removeMembers: jest.fn().mockResolvedValue({}),
				addModerators: jest.fn().mockResolvedValue({}),
				demoteModerators: jest.fn().mockResolvedValue({}),
				inviteMembers: jest.fn().mockResolvedValue({}),
				acceptInvite: jest.fn().mockResolvedValue({}),
				rejectInvite: jest.fn().mockResolvedValue({}),
				queryMembers: jest.fn().mockResolvedValue({}),
				hide: jest.fn().mockResolvedValue({}),
				show: jest.fn().mockResolvedValue({}),
				archive: jest.fn().mockResolvedValue({}),
				unarchive: jest.fn().mockResolvedValue({}),
				pin: jest.fn().mockResolvedValue({}),
				unpin: jest.fn().mockResolvedValue({}),
				mute: jest.fn().mockResolvedValue({}),
				unmute: jest.fn().mockResolvedValue({}),
				muteStatus: jest.fn().mockReturnValue({}),
				markRead: jest.fn().mockResolvedValue({}),
				markUnread: jest.fn().mockResolvedValue({}),
				sendFile: jest.fn().mockResolvedValue({}),
				sendImage: jest.fn().mockResolvedValue({}),
				deleteFile: jest.fn().mockResolvedValue({}),
				deleteImage: jest.fn().mockResolvedValue({}),
				banUser: jest.fn().mockResolvedValue({}),
				unbanUser: jest.fn().mockResolvedValue({}),
				enableSlowMode: jest.fn().mockResolvedValue({}),
				disableSlowMode: jest.fn().mockResolvedValue({}),
				sendAction: jest.fn().mockResolvedValue({}),
				getConfig: jest.fn().mockReturnValue({}),
				sendMessage: jest.fn().mockResolvedValue({}),
			}),
		};

		const { getServerClient } = require('../../nodes/StreamChat/helpers');
		getServerClient.mockResolvedValue(mockClient);

		mockExecuteFunctions = {
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				apiSecret: 'test-secret'
			}),
			getNode: jest.fn().mockReturnValue({
				name: 'StreamChat',
				type: 'n8n-nodes-getstream.streamChat',
			}),
			continueOnFail: jest.fn().mockReturnValue(false),
		} as unknown as IExecuteFunctions;
	});

	describe('Node Properties', () => {
		test('should have correct description', () => {
			expect(streamChatNode.description).toEqual({
				displayName: 'Stream Chat',
				name: 'streamChat',
				icon: 'file:streamchat.svg',
				group: ['transform'],
				version: 1,
				subtitle: '={{$parameter["operation"]}}',
				description: 'Server-side Stream Chat operations',
				defaults: {
					name: 'Stream Chat',
				},
				inputs: ['main'],
				outputs: ['main'],
				credentials: [
					{
						name: 'streamChatApi',
						required: true,
					},
				],
				hints: [
					{
						message: 'This node performs <b>server-side</b> Stream Chat operations. Ensure your API credentials have the necessary permissions for the selected operation.',
						type: 'info',
						location: 'inputPane',
						whenToDisplay: 'always',
					},
					{
						message: 'For bulk operations (creating multiple users/channels), consider enabling <b>Execute Once</b> in the node settings to process all input items together.',
						type: 'info',
						location: 'inputPane',
						whenToDisplay: 'beforeExecution',
						displayCondition: '={{ $input.all().length > 1 && ["upsertUser", "createChannel"].includes($parameter["operation"]) }}',
					},
					{
						message: 'Moderation operations may take a few seconds to propagate across Stream Chat servers. Allow time for changes to take effect.',
						type: 'warning',
						location: 'outputPane',
						whenToDisplay: 'afterExecution',
						displayCondition: '={{ $parameter["resource"] === "moderation" }}',
					},
					{
						message: 'Query operations returned <b>{{$json.length || 0}}</b> results. Use filters to narrow down results or increase limits for more data.',
						type: 'info',
						location: 'outputPane',
						whenToDisplay: 'afterExecution',
						displayCondition: '={{ ["queryUsers", "queryChannels", "searchMessages"].includes($parameter["operation"]) && $json }}',
					},
				],
				properties: expect.any(Array),
			});
		});

		test('should have resource and operation parameters', () => {
			const properties = streamChatNode.description.properties;
			const resourceProperty = properties.find(p => p.name === 'resource');
			const operationProperty = properties.find(p => p.name === 'operation');

			expect(resourceProperty).toBeDefined();
			expect(operationProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');
			expect(operationProperty?.type).toBe('options');
		});
	});

	describe('User Operations', () => {
		test('should generate user token successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('generateToken') // operation
				.mockReturnValueOnce('test-user'); // userId

			const expectedResult = 'generated-token';
			mockClient.createToken = jest.fn().mockReturnValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.createToken).toHaveBeenCalledWith('test-user');
			expect(result).toEqual([[{ json: { token: expectedResult } }]]);
		});

		test('should upsert user successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('upsertUser') // operation
				.mockReturnValueOnce('test-user') // userId
				.mockReturnValueOnce('{"name": "Test User"}'); // userData

			const expectedResult = { users: { 'test-user': { id: 'test-user', name: 'Test User' } } };
			mockClient.upsertUser = jest.fn().mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.upsertUser).toHaveBeenCalledWith({ id: 'test-user', name: 'Test User' });
			expect(result).toEqual([[{ json: expectedResult }]]);
		});

		test('should query users successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('queryUsers') // operation
				.mockReturnValueOnce('{"id": "test-user"}') // queryFilter
				.mockReturnValueOnce(10); // limit

			const expectedResult = { users: [{ id: 'test-user', name: 'Test User' }] };
			mockClient.queryUsers.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.queryUsers).toHaveBeenCalledWith({ id: 'test-user' }, {}, { limit: 10 });
			expect(result).toEqual([[{ json: expectedResult }]]);
		});

		test('should deactivate user successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('deactivateUser') // operation
				.mockReturnValueOnce('test-user'); // userId

			const expectedResult = { user: { id: 'test-user', deactivated: true } };
			mockClient.deactivateUser.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.deactivateUser).toHaveBeenCalledWith('test-user');
			expect(result).toEqual([[{ json: expectedResult }]]);
		});
	});

	describe('Channel Operations', () => {
		test('should create channel successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('channel') // resource
				.mockReturnValueOnce('createChannel') // operation
				.mockReturnValueOnce('messaging') // channelType
				.mockReturnValueOnce('test-channel') // channelId
				.mockReturnValueOnce('user1,user2'); // members

			const expectedResult = { id: 'test-channel', type: 'messaging' };
			mockClient.channel().create.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.channel).toHaveBeenCalledWith('messaging', 'test-channel', { members: ['user1', 'user2'] });
			expect(mockClient.channel().create).toHaveBeenCalled();
			expect(result).toEqual([[{ json: expectedResult }]]);
		});

		test('should update channel successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('channel') // resource
				.mockReturnValueOnce('updateChannel') // operation
				.mockReturnValueOnce('messaging') // channelType
				.mockReturnValueOnce('test-channel') // channelId
				.mockReturnValueOnce('{"name": "Updated Channel"}'); // channelData

			const expectedResult = { id: 'test-channel', name: 'Updated Channel' };
			mockClient.channel().update.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.channel).toHaveBeenCalledWith('messaging', 'test-channel');
			expect(mockClient.channel().update).toHaveBeenCalledWith({ name: 'Updated Channel' });
			expect(result).toEqual([[{ json: expectedResult }]]);
		});
	});

	describe('Message Operations', () => {
		test('should send message successfully', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('message') // resource
				.mockReturnValueOnce('sendMessage') // operation
				.mockReturnValueOnce('messaging:test-channel') // channelCid
				.mockReturnValueOnce('Hello World') // messageText
				.mockReturnValueOnce('test-user'); // userId

			const expectedResult = { id: 'msg-123', text: 'Hello World' };
			mockClient.channel().sendMessage.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.channel).toHaveBeenCalledWith('messaging', 'test-channel');
			expect(mockClient.channel().sendMessage).toHaveBeenCalledWith({ text: 'Hello World', user_id: 'test-user' });
			expect(result).toEqual([[{ json: expectedResult }]]);
		});
	});

	describe('Error Handling', () => {
		test('should handle API errors gracefully when continueOnFail is false', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('upsertUser') // operation
				.mockReturnValueOnce('test-user') // userId
				.mockReturnValueOnce('{"name": "Test User"}'); // userData

			const error = new Error('API Error');
			mockClient.upsertUser.mockRejectedValue(error);

			await expect(streamChatNode.execute.call(mockExecuteFunctions)).rejects.toThrow();
		});

		test('should handle API errors gracefully when continueOnFail is true', async () => {
			mockExecuteFunctions.continueOnFail = jest.fn().mockReturnValue(true);
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('upsertUser') // operation
				.mockReturnValueOnce('test-user') // userId
				.mockReturnValueOnce('{"name": "Test User"}'); // userData

			const error = new Error('API Error');
			mockClient.upsertUser.mockRejectedValue(error);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(result).toEqual([[{ 
				json: { error: 'API Error' },
				pairedItem: { item: 0 }
			}]]);
		});

		test('should handle invalid JSON in parameters', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('user') // resource
				.mockReturnValueOnce('upsertUser') // operation
				.mockReturnValueOnce('test-user') // userId
				.mockReturnValueOnce('invalid-json'); // userData

			await expect(streamChatNode.execute.call(mockExecuteFunctions)).rejects.toThrow();
		});
	});

	describe('Parameter Validation', () => {
		test('should handle empty member lists', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('channel') // resource
				.mockReturnValueOnce('createChannel') // operation
				.mockReturnValueOnce('messaging') // channelType
				.mockReturnValueOnce('test-channel') // channelId
				.mockReturnValueOnce(''); // members (empty)

			const expectedResult = { id: 'test-channel' };
			mockClient.channel().create.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.channel).toHaveBeenCalledWith('messaging', 'test-channel', {});
			expect(result).toEqual([[{ json: expectedResult }]]);
		});

		test('should trim and filter member lists', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('channel') // resource
				.mockReturnValueOnce('addMembers') // operation
				.mockReturnValueOnce('messaging') // channelType
				.mockReturnValueOnce('test-channel') // channelId
				.mockReturnValueOnce(' user1 , user2 , , user3 '); // members with spaces and empty

			const expectedResult = { success: true };
			mockClient.channel().addMembers.mockResolvedValue(expectedResult);

			const result = await streamChatNode.execute.call(mockExecuteFunctions);

			expect(mockClient.channel().addMembers).toHaveBeenCalledWith(['user1', 'user2', 'user3']);
			expect(result).toEqual([[{ json: expectedResult }]]);
		});
	});
});
