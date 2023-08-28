import fetchRetry from 'fetch-retry';

export class Logger {
	constructor(env) {
		this.address = env.LOGGING_ADDRESS;
		this.collection = env.LOGGING_COLLECTION;
		this.accessToken = env.LOGGING_TOKEN;
		this.messages = [];
		this.fetch = fetchRetry(fetch);
	}

	async sendLogs() {
		if (this.messages.length > 0) {
			return this.fetch(`https://${this.address}/${this.collection}`, {
				method: 'POST',
				headers: {
					'X-Access-Token': this.accessToken,
				},
				body: JSON.stringify({
					messages: this.messages,
				}),
				retries: 3,
				retryDelay: 200,
			});
		}
	}

	async log(severity, message) {
		this.messages.push({
			timestamp: Date.now(),
			severity,
			message: new String(message),
		});
	}

	async info(message) {
		return this.log('INFO', message);
	}

	async debug(message) {
		return this.log('DEBUG', message);
	}

	async error(message, stack) {
		this.messages.push({
			timestamp: Date.now(),
			severity: 'ERROR',
			message: new String(message),
			stack: new String(stack),
		});
	}

	async logged(callback) {
		let result;
		try {
			result = await callback();
		} catch (e) {
			this.error(e.message, e.stack);
		}
		return result;
	}
}
