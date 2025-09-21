import { IExecuteFunctions } from 'n8n-workflow/dist/Interfaces';
import { StreamChat } from 'stream-chat';

export async function getServerClient(this: IExecuteFunctions) {
	const creds = await this.getCredentials('streamChatApi');
	if (!creds?.apiKey || !creds?.apiSecret) throw new Error('Missing Stream Chat credentials');
	// Server-side client
	return StreamChat.getInstance(creds.apiKey as string, creds.apiSecret as string);
}
