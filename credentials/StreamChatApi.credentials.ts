import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class StreamChatApi implements ICredentialType {
	name = 'streamChatApi';
	displayName = 'Stream Chat API';
	documentationUrl = 'https://getstream.io/chat/docs/node/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Stream Chat API key',
			hint: 'Found in your Stream Chat dashboard under "App Settings" → "General"',
		},
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Stream Chat API secret (server-side only; do NOT expose client-side)',
			hint: '⚠️ CRITICAL: Never expose this secret client-side. Only use in secure server environments like N8N.',
		},
	];
}
