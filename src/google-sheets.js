import csvparse from './js-csvparser.js';
import getGoogleAuthToken from './google-auth.js';

class Sheet {
	constructor(api, spreadsheetId, gid, sheetName) {
		this.api = api;
		this.spreadsheetId = spreadsheetId;
		this.gid = gid;
		this.sheetName = sheetName;
	}

	async query(sqlQuery) {
		const table = await this.api.requestGSheets(
			`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?gid=${this.gid}&headers=1&tqx=out%3Acsv&tq=${encodeURIComponent(sqlQuery)}`,
			{}
		);

		return csvparse(table).data;
	}

	async append(range, values) {
		let actualRange = `${this.sheetName}!${range}`;
		await this.api.requestGSheets(
			`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${actualRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
			{
				body: JSON.stringify({
					range: actualRange,
					values,
				}),
				method: 'POST',
			}
		);
		return;
	}

	async setValues(range, values) {
		let actualRange = `${this.sheetName}!${range}`;
		await this.api.requestGSheets(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${actualRange}?valueInputOption=RAW`, {
			body: JSON.stringify({
				range: actualRange,
				values,
			}),
			method: 'PUT',
		});
		return;
	}
}

export class SheetsAPI {
	constructor(user, serviceKey) {
		this.user = user;
		this.serviceKey = serviceKey;
		this.requestGSheets = null;
	}

	async authorize() {
		if (this.requestGSheets) {
			return this;
		}
		const scope = 'https://www.googleapis.com/auth/spreadsheets';
		const token = await getGoogleAuthToken(this.user, this.serviceKey, scope);

		this.requestGSheets = async (url, opt) => {
			let options = opt || {};
			options.headers = new Headers({
				Authorization: `Bearer ${token}`,
			});
			if (options.body) {
				options.headers.set('Content-Type', 'application/json;charset=UTF-8');
			}
			const resp = await fetch(url, options);
			if (!resp.ok) {
				throw new Error(await resp.text());
			}
			return resp.text();
		};
		return this;
	}

	async getSheet(spreadsheetId, gid, sheetName) {
		await this.authorize();
		if (!gid) {
			throw new Error('Sheet gid not found!');
		}
		return new Sheet(this, spreadsheetId, gid, sheetName);
	}
}
