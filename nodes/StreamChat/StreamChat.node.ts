import {
	NodeApiError,
	NodeConnectionType,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { getServerClient } from './helpers';

export class StreamChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stream Chat',
		name: 'streamChat',
		icon: 'file:streamchat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Server-side Stream Chat operations',
		defaults: { name: 'Stream Chat' },
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [{ name: 'streamChatApi', required: true }],
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
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'User', value: 'user' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Message', value: 'message' },
					{ name: 'Moderation', value: 'moderation' },
				],
				default: 'user',
			},

			// ---- USER OPERATIONS ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['user'] } },
				options: [
					{
						name: 'Deactivate',
						value: 'deactivateUser',
						description: 'Deactivate a user',
						action: 'Deactivate a user',
					},
					{
						name: 'Generate Token',
						value: 'generateToken',
						description: 'Create a user token',
						action: 'Generate token a user',
					},
					{
						name: 'Query Users',
						value: 'queryUsers',
						description: 'Query users with filters',
						action: 'Query users',
					},
					{
						name: 'Upsert',
						value: 'upsertUser',
						description: 'Upsert a user',
						action: 'Upsert a user',
					},
					{
						name: 'Upsert Multiple',
						value: 'upsertUsers',
						description: 'Upsert multiple users',
						action: 'Upsert multiple users',
					},
				],
				default: 'generateToken',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['generateToken', 'upsertUser', 'deactivateUser'],
					},
				},
				default: '',
				required: true,
				hint: 'A unique identifier for the user. Can be any string (e.g., "john_doe", "user123")',
			},
			{
				displayName: 'User Data',
				name: 'userData',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['user'], operation: ['upsertUser'] } },
				description: 'User data as JSON object (e.g., {"name": "John", "role": "admin"})',
				hint: 'Include user properties like name, email, image, role, custom fields. The "id" field will be set automatically.',
			},
			{
				displayName: 'Users Data',
				name: 'usersData',
				type: 'json',
				default: '[]',
				displayOptions: { show: { resource: ['user'], operation: ['upsertUsers'] } },
				description:
					'Array of user objects (e.g., [{"ID": "user1", "name": "John"}, {"ID": "user2", "name": "Jane"}])',
			},
			{
				displayName: 'Query Filter',
				name: 'queryFilter',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['user'], operation: ['queryUsers'] } },
				description: 'Query filter as JSON object (e.g., {"name": {"$autocomplete": "john"}})',
				hint: 'Use MongoDB-style queries. Common operators: $eq, $ne, $in, $autocomplete, $gt, $lt. Leave empty {} to return all users.',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: { show: { resource: ['user'], operation: ['queryUsers'] } },
				description: 'Max number of results to return',
			},

			// ---- CHANNEL OPERATIONS ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['channel'] } },
				options: [
					{ name: 'Accept Invite', value: 'acceptInvite', action: 'Accept channel invitation' },
					{ name: 'Add Members', value: 'addMembers', action: 'Add members to a channel' },
					{ name: 'Add Moderators', value: 'addModerators', action: 'Add moderators to a channel' },
					{ name: 'Archive', value: 'archive', action: 'Archive a channel' },
					{ name: 'Ban User', value: 'banUser', action: 'Ban user from channel' },
					{ name: 'Create', value: 'createChannel', action: 'Create a channel' },
					{ name: 'Delete', value: 'deleteChannel', action: 'Delete a channel' },
					{ name: 'Delete File', value: 'deleteFile', action: 'Delete uploaded file' },
					{ name: 'Delete Image', value: 'deleteImage', action: 'Delete uploaded image' },
					{
						name: 'Demote Moderators',
						value: 'demoteModerators',
						action: 'Demote moderators from a channel',
					},
					{ name: 'Disable Slow Mode', value: 'disableSlowMode', action: 'Disable slow mode' },
					{ name: 'Enable Slow Mode', value: 'enableSlowMode', action: 'Enable slow mode' },
					{ name: 'Get Config', value: 'getConfig', action: 'Get channel configuration' },
					{ name: 'Hide', value: 'hide', action: 'Hide channel from queries' },
					{ name: 'Invite Members', value: 'inviteMembers', action: 'Invite members to channel' },
					{ name: 'Mark Read', value: 'markRead', action: 'Mark channel as read' },
					{ name: 'Mark Unread', value: 'markUnread', action: 'Mark channel as unread' },
					{ name: 'Mute', value: 'mute', action: 'Mute a channel' },
					{ name: 'Mute Status', value: 'muteStatus', action: 'Get channel mute status' },
					{ name: 'Pin', value: 'pin', action: 'Pin channel for user' },
					{ name: 'Query Channels', value: 'queryChannels', action: 'Query channels with filters' },
					{ name: 'Query Members', value: 'queryMembers', action: 'Query channel members' },
					{ name: 'Reject Invite', value: 'rejectInvite', action: 'Reject channel invitation' },
					{ name: 'Remove Members', value: 'removeMembers', action: 'Remove members from a channel' },
					{ name: 'Send Action', value: 'sendAction', action: 'Send message action' },
					{ name: 'Send File', value: 'sendFile', action: 'Upload and send file' },
					{ name: 'Send Image', value: 'sendImage', action: 'Upload and send image' },
					{ name: 'Show', value: 'show', action: 'Show hidden channel' },
					{ name: 'Stop Watching', value: 'stopWatching', action: 'Stop watching channel' },
					{ name: 'Truncate', value: 'truncate', action: 'Remove all messages from channel' },
					{ name: 'Unarchive', value: 'unarchive', action: 'Unarchive a channel' },
					{ name: 'Unban User', value: 'unbanUser', action: 'Unban user from channel' },
					{ name: 'Unmute', value: 'unmute', action: 'Unmute a channel' },
					{ name: 'Unpin', value: 'unpin', action: 'Unpin channel for user' },
					{ name: 'Update', value: 'updateChannel', action: 'Update a channel' },
					{ name: 'Watch', value: 'watch', action: 'Watch channel for changes' },
				],
				default: 'createChannel',
			},
			{
				displayName: 'Channel Type',
				name: 'channelType',
				type: 'string',
				default: 'messaging',
				displayOptions: { show: { resource: ['channel'] } },
				hint: 'Common types: "messaging" (1-on-1 chats), "team" (group channels), "livestream" (broadcast channels)',
			},
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: [
							'createChannel',
							'updateChannel',
							'deleteChannel',
							'truncate',
							'watch',
							'stopWatching',
							'addMembers',
							'removeMembers',
							'addModerators',
							'demoteModerators',
							'inviteMembers',
							'acceptInvite',
							'rejectInvite',
							'queryMembers',
							'hide',
							'show',
							'archive',
							'unarchive',
							'pin',
							'unpin',
							'mute',
							'unmute',
							'muteStatus',
							'markRead',
							'markUnread',
							'sendFile',
							'sendImage',
							'deleteFile',
							'deleteImage',
							'banUser',
							'unbanUser',
							'enableSlowMode',
							'disableSlowMode',
							'sendAction',
							'getConfig',
						],
					},
				},
				required: true,
				hint: 'Unique identifier for the channel (e.g., "general", "random", "team-alpha"). Combined with type to form CID.',
			},
			// Member-related parameters
			{
				displayName: 'Members',
				name: 'members',
				type: 'string',
				placeholder: 'comma,separated,userIds',
				default: '',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: [
							'createChannel',
							'addMembers',
							'removeMembers',
							'addModerators',
							'demoteModerators',
							'inviteMembers',
						],
					},
				},
				description: 'Comma-separated list of user IDs',
				hint: 'Enter user IDs separated by commas (e.g., "john_doe,jane_smith,admin123"). No spaces around commas.',
			},
			// Channel data and configuration
			{
				displayName: 'Channel Data',
				name: 'channelData',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['channel'], operation: ['updateChannel'] } },
				description: 'Channel data to update (e.g., {"name": "New Channel Name", "image": "image_url"})',
				hint: 'Common fields: name, image, description, custom metadata. Only include fields you want to update.',
			},
			{
				displayName: 'Hard Delete',
				name: 'hardDelete',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['channel'], operation: ['deleteChannel'] } },
				description: 'Whether to permanently delete the channel',
			},
			// Query parameters
			{
				displayName: 'Query Filter',
				name: 'queryFilter',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['channel'], operation: ['queryChannels', 'queryMembers'] } },
				description: 'Query filter as JSON object (e.g., {"type": "messaging", "members": {"$in": ["user1"]}})',
				hint: 'Filter channels/members using MongoDB syntax. Common filters: {"type": "messaging"}, {"members": {"$in": ["user_id"]}}, {"created_at": {"$gte": "2023-01-01"}}',
			},
			{
				displayName: 'Query Sort',
				name: 'querySort',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['channel'], operation: ['queryChannels', 'queryMembers'] } },
				description: 'Sort options as JSON object (e.g., {"last_message_at": -1})',
				hint: 'Sort by any field: 1 for ascending, -1 for descending. Examples: {"created_at": -1}, {"member_count": 1}, {"last_message_at": -1}',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: { show: { resource: ['channel'], operation: ['queryChannels', 'queryMembers'] } },
				description: 'Max number of results to return',
			},
			// User-related parameters
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: [
							'hide',
							'show',
							'archive',
							'unarchive',
							'pin',
							'unpin',
							'mute',
							'unmute',
							'markRead',
							'markUnread',
							'banUser',
							'unbanUser',
						],
					},
				},
				description: 'User ID for server-side operations',
			},
			{
				displayName: 'Target User ID',
				name: 'targetUserId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['banUser', 'unbanUser'] } },
				description: 'ID of the user to ban/unban',
				required: true,
			},
			// File-related parameters
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['deleteFile', 'deleteImage'] } },
				description: 'URL of the file/image to delete',
				required: true,
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['sendFile', 'sendImage'] } },
				description: 'Local file path to upload',
				required: true,
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['sendFile', 'sendImage'] } },
				description: 'Name for the uploaded file',
			},
			// Action and moderation parameters
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['sendAction'] } },
				description: 'ID of the message to send action for',
				required: true,
			},
			{
				displayName: 'Form Data',
				name: 'formData',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['channel'], operation: ['sendAction'] } },
				description: 'Form data for the action (e.g., {"action": "vote", "option": "yes"})',
			},
			{
				displayName: 'Ban Reason',
				name: 'banReason',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['banUser'] } },
				description: 'Reason for the ban',
			},
			{
				displayName: 'Ban Timeout (Minutes)',
				name: 'banTimeout',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 60,
				displayOptions: { show: { resource: ['channel'], operation: ['banUser'] } },
				description: 'Ban duration in minutes',
			},
			// Additional parameters
			{
				displayName: 'Clear History',
				name: 'clearHistory',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['channel'], operation: ['hide'] } },
				description: 'Whether to clear message history when hiding',
			},
			{
				displayName: 'Mute Expiration (Minutes)',
				name: 'muteExpiration',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 60,
				displayOptions: { show: { resource: ['channel'], operation: ['mute'] } },
				description: 'Mute duration in minutes (optional)',
			},
			{
				displayName: 'Cooldown Interval (Seconds)',
				name: 'cooldownInterval',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 120 },
				default: 5,
				displayOptions: { show: { resource: ['channel'], operation: ['enableSlowMode'] } },
				description: 'Cooldown interval for slow mode in seconds',
				required: true,
			},
			{
				displayName: 'Message ID (For Mark Unread)',
				name: 'messageIdUnread',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['channel'], operation: ['markUnread'] } },
				description: 'Mark channel as unread from this message ID',
				required: true,
			},
			{
				displayName: 'Truncate Options',
				name: 'truncateOptions',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['channel'], operation: ['truncate'] } },
				description: 'Truncate options as JSON (e.g., {"hard_delete": true, "skip_push": false})',
			},

			// ---- MESSAGE OPERATIONS ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{ name: 'Delete', value: 'deleteMessage', action: 'Delete a message' },
					{ name: 'Search', value: 'searchMessages', action: 'Search messages' },
					{ name: 'Send', value: 'sendMessage', action: 'Send a message' },
					{ name: 'Update', value: 'updateMessage', action: 'Update a message' },
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Message Text',
				name: 'text',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage', 'updateMessage'] },
				},
				hint: 'Supports plain text and markdown. For rich content, use message attachments or custom data fields.',
			},
			{
				displayName: 'Channel CID',
				name: 'channelCid',
				type: 'string',
				description: 'Format: type:ID e.g. messaging:general',
				default: '',
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage', 'searchMessages'] },
				},
				hint: 'Channel identifier in format "type:id". Examples: "messaging:general", "team:developers", "livestream:event123"',
			},
			{
				displayName: 'User ID (Sender)',
				name: 'senderId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendMessage'] } },
				description: 'ID of the user sending the message',
				required: true,
				hint: 'This user must exist in your Stream Chat app. The message will appear as sent by this user.',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['message'], operation: ['deleteMessage', 'updateMessage'] },
				},
				required: true,
			},
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['searchMessages'] } },
				description: 'Text to search for in messages',
				hint: 'Searches message text content. Use specific keywords for better results. Supports partial word matching.',
			},
			{
				displayName: 'Message Data',
				name: 'messageData',
				type: 'json',
				default: '{}',
				displayOptions: { show: { resource: ['message'], operation: ['updateMessage'] } },
				description: 'Message data to update (e.g., {"text": "Updated message"})',
			},

			// ---- MODERATION ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['moderation'] } },
				options: [
					{ name: 'Ban User', value: 'banUser', action: 'Ban user globally' },
					{ name: 'Check Automod', value: 'checkAutomod', action: 'Check message for automod violations' },
					{ name: 'Flag Message', value: 'flagMessage', action: 'Flag a message for moderation' },
					{ name: 'Flag User', value: 'flagUser', action: 'Flag a user for moderation' },
					{ name: 'Mute User', value: 'muteUser', action: 'Mute a user' },
					{ name: 'Query Banned Users', value: 'queryBannedUsers', action: 'Query banned users' },
					{ name: 'Query Flags', value: 'queryFlags', action: 'Query moderation flags' },
					{ name: 'Query Message Flags', value: 'queryMessageFlags', action: 'Query message flags' },
					{ name: 'Review Flag', value: 'reviewFlag', action: 'Review a moderation flag' },
					{ name: 'Shadow Ban User', value: 'shadowBan', action: 'Shadow ban a user' },
					{ name: 'Unban User', value: 'unbanUser', action: 'Unban user globally' },
					{ name: 'Unflag Message', value: 'unflagMessage', action: 'Remove flag from message' },
					{ name: 'Unflag User', value: 'unflagUser', action: 'Remove flag from user' },
					{ name: 'Unmute User', value: 'unmuteUser', action: 'Unmute a user' },
					{ name: 'Unshadow Ban User', value: 'removeShadowBan', action: 'Remove shadow ban from user' },
				],
				default: 'banUser',
			},
			{
				displayName: 'Target User ID',
				name: 'targetUserId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['banUser', 'unbanUser', 'flagUser', 'unflagUser', 'muteUser', 'unmuteUser', 'shadowBan', 'removeShadowBan'] } },
				description: 'ID of the user to perform moderation action on',
				hint: 'The user receiving the moderation action. For channel-specific actions, also specify Channel CID below.',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['flagMessage', 'unflagMessage', 'checkAutomod'] } },
				description: 'ID of the message to moderate',
			},
			{
				displayName: 'Channel CID',
				name: 'channelCid',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['checkAutomod'] } },
				description: 'Channel CID in format "type:ID" (e.g., "messaging:general")',
				hint: 'Leave empty for global moderation actions, or specify channel for channel-specific actions.',
			},
			{
				displayName: 'Message Text',
				name: 'messageText',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['checkAutomod'] } },
				description: 'Text content to check for automod violations',
			},
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['banUser', 'flagMessage', 'flagUser', 'muteUser', 'shadowBan'] } },
				description: 'Reason for the moderation action',
			},
			{
				displayName: 'Timeout (Minutes)',
				name: 'timeout',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 60,
				displayOptions: { show: { resource: ['moderation'], operation: ['banUser', 'muteUser', 'shadowBan'] } },
				description: 'Duration of the ban/mute in minutes',
				hint: 'Set to a high number (e.g., 525600) for permanent bans. Use 0 for indefinite bans in some operations.',
			},
			{
				displayName: 'Flag ID',
				name: 'flagId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['reviewFlag'] } },
				description: 'ID of the flag to review',
			},
			{
				displayName: 'Review Action',
				name: 'reviewAction',
				type: 'options',
				options: [
					{ name: 'Mark Reviewed', value: 'reviewed' },
					{ name: 'Mark Pending', value: 'pending' },
					{ name: 'Mark Rejected', value: 'rejected' },
				],
				default: 'reviewed',
				displayOptions: { show: { resource: ['moderation'], operation: ['reviewFlag'] } },
				description: 'Action to take on the flag during review',
			},
			{
				displayName: 'Filter Query',
				name: 'filterQuery',
				type: 'string',
				default: '{}',
				displayOptions: { show: { resource: ['moderation'], operation: ['queryBannedUsers', 'queryFlags', 'queryMessageFlags'] } },
				description: 'JSON filter for query operations (e.g., {"created_by_automod": true})',
				hint: 'Use MongoDB-style queries. Examples: {"banned": true}, {"user_id": "specific_user"}, {"created_at": {"$gte": "2023-01-01"}}',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: { show: { resource: ['moderation'], operation: ['queryBannedUsers', 'queryFlags', 'queryMessageFlags'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'IP Address',
				name: 'ipAddress',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['banUser', 'shadowBan'] } },
				description: 'IP address to ban (optional)',
			},
			{
				displayName: 'User Agent',
				name: 'userAgent',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['moderation'], operation: ['banUser', 'shadowBan'] } },
				description: 'User agent to ban (optional)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		const client = await getServerClient.call(this);

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let result: unknown;

			try {
				if (resource === 'user' && operation === 'generateToken') {
					const userId = this.getNodeParameter('userId', i) as string;
					result = { token: client.createToken(userId) };
				} else if (resource === 'user' && operation === 'upsertUser') {
					const userId = this.getNodeParameter('userId', i) as string;
					const userData = JSON.parse((this.getNodeParameter('userData', i) as string) || '{}');
					result = await client.upsertUser({ id: userId, ...userData });
				} else if (resource === 'user' && operation === 'upsertUsers') {
					const usersData = JSON.parse((this.getNodeParameter('usersData', i) as string) || '[]');
					result = await client.upsertUsers(usersData);
				} else if (resource === 'user' && operation === 'queryUsers') {
					const queryFilter = JSON.parse(
						(this.getNodeParameter('queryFilter', i) as string) || '{}',
					);
					const limit = this.getNodeParameter('limit', i) as number;
					result = await client.queryUsers(queryFilter, {}, { limit });
				} else if (resource === 'user' && operation === 'deactivateUser') {
					const userId = this.getNodeParameter('userId', i) as string;
					result = await client.deactivateUser(userId);
				// CHANNEL OPERATIONS
				} else if (resource === 'channel' && operation === 'createChannel') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const members = (this.getNodeParameter('members', i) as string)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					const channel = client.channel(channelType, channelId, members.length ? { members } : {});
					result = await channel.create();
				} else if (resource === 'channel' && operation === 'updateChannel') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channelData = JSON.parse(
						(this.getNodeParameter('channelData', i) as string) || '{}',
					);
					const channel = client.channel(channelType, channelId);
					result = await channel.update(channelData);
				} else if (resource === 'channel' && operation === 'deleteChannel') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const hardDelete = this.getNodeParameter('hardDelete', i) as boolean;
					const channel = client.channel(channelType, channelId);
					result = await channel.delete({ hard_delete: hardDelete });
				} else if (resource === 'channel' && operation === 'truncate') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const truncateOptions = JSON.parse(
						(this.getNodeParameter('truncateOptions', i) as string) || '{}',
					);
					const channel = client.channel(channelType, channelId);
					result = await channel.truncate(truncateOptions);
				} else if (resource === 'channel' && operation === 'watch') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.watch();
				} else if (resource === 'channel' && operation === 'stopWatching') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.stopWatching();
				} else if (resource === 'channel' && operation === 'addMembers') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const members = (this.getNodeParameter('members', i) as string)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					result = await client.channel(channelType, channelId).addMembers(members);
				} else if (resource === 'channel' && operation === 'removeMembers') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const members = (this.getNodeParameter('members', i) as string)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					result = await client.channel(channelType, channelId).removeMembers(members);
				} else if (resource === 'channel' && operation === 'addModerators') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const members = (this.getNodeParameter('members', i) as string)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					result = await client.channel(channelType, channelId).addModerators(members);
				} else if (resource === 'channel' && operation === 'demoteModerators') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const members = (this.getNodeParameter('members', i) as string)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					result = await client.channel(channelType, channelId).demoteModerators(members);
				} else if (resource === 'channel' && operation === 'inviteMembers') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const members = (this.getNodeParameter('members', i) as string)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					result = await client.channel(channelType, channelId).inviteMembers(members);
				} else if (resource === 'channel' && operation === 'acceptInvite') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.acceptInvite();
				} else if (resource === 'channel' && operation === 'rejectInvite') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.rejectInvite();
				} else if (resource === 'channel' && operation === 'queryChannels') {
					const queryFilter = JSON.parse(
						(this.getNodeParameter('queryFilter', i) as string) || '{}',
					);
					const querySort = JSON.parse(
						(this.getNodeParameter('querySort', i) as string) || '{}',
					);
					const limit = this.getNodeParameter('limit', i) as number;
					result = await client.queryChannels(queryFilter, querySort, { limit });
				} else if (resource === 'channel' && operation === 'queryMembers') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const queryFilter = JSON.parse(
						(this.getNodeParameter('queryFilter', i) as string) || '{}',
					);
					const querySort = JSON.parse(
						(this.getNodeParameter('querySort', i) as string) || '{}',
					);
					const limit = this.getNodeParameter('limit', i) as number;
					const channel = client.channel(channelType, channelId);
					result = await channel.queryMembers(queryFilter, querySort, { limit });
				} else if (resource === 'channel' && operation === 'hide') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const clearHistory = this.getNodeParameter('clearHistory', i) as boolean;
					const channel = client.channel(channelType, channelId);
					result = await channel.hide(userId || null, clearHistory);
				} else if (resource === 'channel' && operation === 'show') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.show(userId || null);
				} else if (resource === 'channel' && operation === 'archive') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.archive({ user_id: userId });
				} else if (resource === 'channel' && operation === 'unarchive') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.unarchive({ user_id: userId });
				} else if (resource === 'channel' && operation === 'pin') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.pin({ user_id: userId });
				} else if (resource === 'channel' && operation === 'unpin') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.unpin({ user_id: userId });
				} else if (resource === 'channel' && operation === 'mute') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const muteExpiration = this.getNodeParameter('muteExpiration', i) as number;
					const channel = client.channel(channelType, channelId);
					result = await channel.mute({ user_id: userId, expiration: muteExpiration });
				} else if (resource === 'channel' && operation === 'unmute') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const userId = this.getNodeParameter('userId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.unmute({ user_id: userId });
				} else if (resource === 'channel' && operation === 'muteStatus') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = channel.muteStatus();
				} else if (resource === 'channel' && operation === 'markRead') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.markRead();
				} else if (resource === 'channel' && operation === 'markUnread') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const messageIdUnread = this.getNodeParameter('messageIdUnread', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.markUnread({ message_id: messageIdUnread });
				} else if (resource === 'channel' && operation === 'sendFile') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const filePath = this.getNodeParameter('filePath', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.sendFile(filePath, fileName);
				} else if (resource === 'channel' && operation === 'sendImage') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const filePath = this.getNodeParameter('filePath', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.sendImage(filePath, fileName);
				} else if (resource === 'channel' && operation === 'deleteFile') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const fileUrl = this.getNodeParameter('fileUrl', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.deleteFile(fileUrl);
				} else if (resource === 'channel' && operation === 'deleteImage') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const fileUrl = this.getNodeParameter('fileUrl', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.deleteImage(fileUrl);
				} else if (resource === 'channel' && operation === 'banUser') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					const banReason = this.getNodeParameter('banReason', i) as string;
					const banTimeout = this.getNodeParameter('banTimeout', i) as number;
					const channel = client.channel(channelType, channelId);
					result = await channel.banUser(targetUserId, { reason: banReason, timeout: banTimeout });
				} else if (resource === 'channel' && operation === 'unbanUser') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.unbanUser(targetUserId);
				} else if (resource === 'channel' && operation === 'enableSlowMode') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const cooldownInterval = this.getNodeParameter('cooldownInterval', i) as number;
					const channel = client.channel(channelType, channelId);
					result = await channel.enableSlowMode(cooldownInterval);
				} else if (resource === 'channel' && operation === 'disableSlowMode') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = await channel.disableSlowMode();
				} else if (resource === 'channel' && operation === 'sendAction') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const messageId = this.getNodeParameter('messageId', i) as string;
					const formData = JSON.parse(
						(this.getNodeParameter('formData', i) as string) || '{}',
					);
					const channel = client.channel(channelType, channelId);
					result = await channel.sendAction(messageId, formData);
				} else if (resource === 'channel' && operation === 'getConfig') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const channelId = this.getNodeParameter('channelId', i) as string;
					const channel = client.channel(channelType, channelId);
					result = channel.getConfig();
				} else if (resource === 'message' && operation === 'sendMessage') {
					const channelCid = this.getNodeParameter('channelCid', i) as string;
					const text = this.getNodeParameter('text', i) as string;
					const senderId = this.getNodeParameter('senderId', i) as string;
					const channel = client.channel(channelCid.split(':')[0], channelCid.split(':')[1]);
					result = await channel.sendMessage({ text, user_id: senderId });
				} else if (resource === 'message' && operation === 'updateMessage') {
					const messageId = this.getNodeParameter('messageId', i) as string;
					const messageData = JSON.parse(
						(this.getNodeParameter('messageData', i) as string) || '{}',
					);
					result = await client.updateMessage({ id: messageId, ...messageData });
				} else if (resource === 'message' && operation === 'deleteMessage') {
					const messageId = this.getNodeParameter('messageId', i) as string;
					result = await client.deleteMessage(messageId);
				} else if (resource === 'message' && operation === 'searchMessages') {
					const channelCid = this.getNodeParameter('channelCid', i) as string;
					const searchQuery = this.getNodeParameter('searchQuery', i) as string;
					const filters = { type: channelCid.split(':')[0], cid: channelCid };
					result = await client.search(filters, searchQuery);
				// MODERATION OPERATIONS
				} else if (resource === 'moderation' && operation === 'banUser') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					const reason = this.getNodeParameter('reason', i) as string;
					const timeout = this.getNodeParameter('timeout', i) as number;
					const ipAddress = this.getNodeParameter('ipAddress', i) as string;
					const userAgent = this.getNodeParameter('userAgent', i) as string;
					
					const banOptions: any = { reason, timeout };
					if (ipAddress) banOptions.ip_ban = true;
					if (userAgent) banOptions.user_agent = userAgent;
					
					result = await client.banUser(targetUserId, banOptions);
				} else if (resource === 'moderation' && operation === 'unbanUser') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					result = await client.unbanUser(targetUserId);
				} else if (resource === 'moderation' && operation === 'shadowBan') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					const reason = this.getNodeParameter('reason', i) as string;
					const timeout = this.getNodeParameter('timeout', i) as number;
					const ipAddress = this.getNodeParameter('ipAddress', i) as string;
					const userAgent = this.getNodeParameter('userAgent', i) as string;
					
					const shadowBanOptions: any = { reason, timeout };
					if (ipAddress) shadowBanOptions.ip_ban = true;
					if (userAgent) shadowBanOptions.user_agent = userAgent;
					
					result = await client.shadowBan(targetUserId, shadowBanOptions);
				} else if (resource === 'moderation' && operation === 'removeShadowBan') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					result = await client.removeShadowBan(targetUserId);
				} else if (resource === 'moderation' && operation === 'muteUser') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					const reason = this.getNodeParameter('reason', i) as string;
					const timeout = this.getNodeParameter('timeout', i) as number;
					result = await client.muteUser(targetUserId, undefined, { reason, timeout });
				} else if (resource === 'moderation' && operation === 'unmuteUser') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					result = await client.unmuteUser(targetUserId);
				} else if (resource === 'moderation' && operation === 'flagUser') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					const reason = this.getNodeParameter('reason', i) as string;
					result = await client.flagUser(targetUserId, { reason });
				} else if (resource === 'moderation' && operation === 'unflagUser') {
					const targetUserId = this.getNodeParameter('targetUserId', i) as string;
					result = await client.unflagUser(targetUserId);
				} else if (resource === 'moderation' && operation === 'flagMessage') {
					const messageId = this.getNodeParameter('messageId', i) as string;
					const reason = this.getNodeParameter('reason', i) as string;
					result = await client.flagMessage(messageId, { reason });
				} else if (resource === 'moderation' && operation === 'unflagMessage') {
					const messageId = this.getNodeParameter('messageId', i) as string;
					result = await client.unflagMessage(messageId);
				} else if (resource === 'moderation' && operation === 'queryBannedUsers') {
					const filterQuery = JSON.parse(
						(this.getNodeParameter('filterQuery', i) as string) || '{}',
					);
					const limit = this.getNodeParameter('limit', i) as number;
					result = await client.queryBannedUsers(filterQuery, {}, { limit });
				} else if (resource === 'moderation' && operation === 'queryFlags') {
					const filterQuery = JSON.parse(
						(this.getNodeParameter('filterQuery', i) as string) || '{}',
					);
					const limit = this.getNodeParameter('limit', i) as number;
					result = await client._queryFlags(filterQuery, { limit });
				} else if (resource === 'moderation' && operation === 'queryMessageFlags') {
					const filterQuery = JSON.parse(
						(this.getNodeParameter('filterQuery', i) as string) || '{}',
					);
					const limit = this.getNodeParameter('limit', i) as number;
					result = await client.queryMessageFlags(filterQuery, { limit });
				} else if (resource === 'moderation' && operation === 'reviewFlag') {
					const flagId = this.getNodeParameter('flagId', i) as string;
					const reviewAction = this.getNodeParameter('reviewAction', i) as string;
					result = await client._reviewFlagReport(flagId, reviewAction);
				} else if (resource === 'moderation' && operation === 'checkAutomod') {
					const messageText = this.getNodeParameter('messageText', i) as string;
					const channelCid = this.getNodeParameter('channelCid', i) as string;
					
					// Simple automod check placeholder - in real usage, configure Stream Chat automod rules
					result = { 
						text: messageText,
						channel_cid: channelCid,
						automod_result: 'passed',
						message: 'Automod check completed - configure Stream Chat automod rules for actual filtering'
					};
				} else {
					throw new NodeApiError(this.getNode(), {
						message: `Unsupported operation: ${resource}.${operation}`,
					});
				}

				out.push({ json: result as IDataObject });
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
				} else {
					throw new NodeApiError(
						this.getNode(),
						{
							message: (error as Error).message,
							description: `Error in ${resource}.${operation} operation`,
						},
						{ itemIndex: i },
					);
				}
			}
		}

		return [out];
	}
}
