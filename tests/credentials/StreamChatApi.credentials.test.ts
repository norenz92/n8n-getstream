import { StreamChatApi } from '../../credentials/StreamChatApi.credentials';

describe('StreamChatApi Credentials', () => {
	let credentials: StreamChatApi;

	beforeEach(() => {
		credentials = new StreamChatApi();
	});

	describe('Class Properties', () => {
		test('should have correct name', () => {
			expect(credentials.name).toBe('streamChatApi');
		});

		test('should have correct displayName', () => {
			expect(credentials.displayName).toBe('Stream Chat API');
		});

		test('should have correct documentationUrl', () => {
			expect(credentials.documentationUrl).toBe('https://getstream.io/chat/docs/node/');
		});
	});

	describe('Properties Configuration', () => {
		test('should have required properties defined', () => {
			expect(credentials.properties).toHaveLength(2);
		});

		test('should have apiKey property correctly configured', () => {
			const apiKeyProperty = credentials.properties.find(prop => prop.name === 'apiKey');
			expect(apiKeyProperty).toBeDefined();
			expect(apiKeyProperty?.displayName).toBe('API Key');
			expect(apiKeyProperty?.type).toBe('string');
			expect(apiKeyProperty?.required).toBe(true);
			expect(apiKeyProperty?.description).toBe('Stream Chat API key');
			expect(apiKeyProperty?.typeOptions?.password).toBe(true);
		});

		test('should have apiSecret property correctly configured', () => {
			const apiSecretProperty = credentials.properties.find(prop => prop.name === 'apiSecret');
			expect(apiSecretProperty).toBeDefined();
			expect(apiSecretProperty?.displayName).toBe('API Secret');
			expect(apiSecretProperty?.type).toBe('string');
			expect(apiSecretProperty?.typeOptions?.password).toBe(true);
			expect(apiSecretProperty?.required).toBe(true);
			expect(apiSecretProperty?.description).toBe('Stream Chat API secret (server-side only; do NOT expose client-side)');
		});
	});

	describe('Credential Validation', () => {
		test('should validate required fields are present', () => {
			const requiredFields = credentials.properties.filter(prop => prop.required);
			expect(requiredFields).toHaveLength(2);
			expect(requiredFields.map(field => field.name)).toEqual(['apiKey', 'apiSecret']);
		});

		test('should have password type for both credential fields', () => {
			credentials.properties.forEach(property => {
				expect(property.typeOptions?.password).toBe(true);
			});
		});

		test('should have string type for all properties', () => {
			credentials.properties.forEach(property => {
				expect(property.type).toBe('string');
			});
		});

		test('should have default empty values', () => {
			credentials.properties.forEach(property => {
				expect(property.default).toBe('');
			});
		});
	});
});
