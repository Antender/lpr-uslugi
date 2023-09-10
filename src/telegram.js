export function telegram(bot_token) {
	return async (command, data) => {
		const resp = await fetch(`https://api.telegram.org/bot${bot_token}/${command}`, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json;charset=UTF-8',
			},
		});
		if (!resp.ok) {
			throw new Error(await resp.text());
		}
	};
}
