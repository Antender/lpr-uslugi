export class Trello {
	constructor(trelloKey, trelloToken) {
		this.trelloKey = trelloKey;
		this.trelloToken = trelloToken;
	}

	async makeCall(url, method, query, data) {
		let querystr = `?key=${this.trelloKey}&token=${this.trelloToken}`;
		for (let queryitem in query || {}) {
			querystr += `&${encodeURIComponent(queryitem)}=${encodeURIComponent(query[queryitem])}`;
		}
		const res = await fetch(`https://api.trello.com/${url}${querystr}`, {
			method: method ? method : 'GET',
			body: data ? JSON.stringify(data) : undefined,
			headers: data
				? new Headers({
						'Content-Type': 'application/json;charset=UTF-8',
				  })
				: undefined,
		});
		if (!res.ok) {
			throw new Error(await res.text());
		}
		return res.json();
	}

	async getCard(cardId, query) {
		return this.makeCall(`1/cards/${cardId}`, 'GET', query);
	}

	async updateCard(cardId, data) {
		return this.makeCall(`1/cards/${cardId}`, 'PUT', {}, data);
	}

	async addComment(cardId, text) {
		return this.makeCall(`1/cards/${cardId}/actions/comments`, 'POST', {}, { text });
	}
}
