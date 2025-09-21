import { getServerClient } from '../../nodes/StreamChat/helpers';
import { StreamChat } from 'stream-chat';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock stream-chat
jest.mock('stream-chat');

describe('StreamChat Helpers', () => {
	const mockCredentials = {
		apiKey: 'test-api-key',
		apiSecret: 'test-api-secret'
	};

	let mockExecuteFunctions: IExecuteFunctions;

	beforeEach(() => {
		jest.clearAllMocks();
		
		mockExecuteFunctions = {
			getCredentials: jest.fn().mockResolvedValue(mockCredentials),
		} as unknown as IExecuteFunctions;
	});

	describe('getServerClient', () => {
		test('should create StreamChat server client with correct credentials', async () => {
			const mockClient = {
				connectUser: jest.fn(),
				disconnectUser: jest.fn(),
			};

			(StreamChat.getInstance as jest.Mock).mockReturnValue(mockClient);

			const result = await getServerClient.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.getCredentials).toHaveBeenCalledWith('streamChatApi');
			expect(StreamChat.getInstance).toHaveBeenCalledWith(
				mockCredentials.apiKey,
				mockCredentials.apiSecret
			);
			expect(result).toBe(mockClient);
		});

		test('should handle missing API key', async () => {
			const invalidCredentials = {
				apiKey: '',
				apiSecret: 'test-api-secret'
			};

			mockExecuteFunctions.getCredentials = jest.fn().mockResolvedValue(invalidCredentials);

			await expect(getServerClient.call(mockExecuteFunctions)).rejects.toThrow('Missing Stream Chat credentials');
		});

		test('should handle missing API secret', async () => {
			const invalidCredentials = {
				apiKey: 'test-api-key',
				apiSecret: ''
			};

			mockExecuteFunctions.getCredentials = jest.fn().mockResolvedValue(invalidCredentials);

			await expect(getServerClient.call(mockExecuteFunctions)).rejects.toThrow('Missing Stream Chat credentials');
		});

		test('should handle missing credentials object', async () => {
			mockExecuteFunctions.getCredentials = jest.fn().mockResolvedValue(null);

			await expect(getServerClient.call(mockExecuteFunctions)).rejects.toThrow('Missing Stream Chat credentials');
		});

		test('should handle credentials retrieval error', async () => {
			mockExecuteFunctions.getCredentials = jest.fn().mockRejectedValue(new Error('Credentials error'));

			await expect(getServerClient.call(mockExecuteFunctions)).rejects.toThrow('Credentials error');
		});

		test('should handle StreamChat initialization error', async () => {
			(StreamChat.getInstance as jest.Mock).mockImplementation(() => {
				throw new Error('StreamChat initialization failed');
			});

			await expect(getServerClient.call(mockExecuteFunctions)).rejects.toThrow('StreamChat initialization failed');
		});
	});
});
