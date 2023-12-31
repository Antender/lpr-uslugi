async function getGoogleAuthToken(user, key, scope) {
	function objectToBase64url(object) {
		return arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(object)));
	}
	function arrayBufferToBase64Url(buffer) {
		return btoa(String.fromCharCode(...new Uint8Array(buffer)))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}
	function str2ab(str) {
		const buf = new ArrayBuffer(str.length);
		const bufView = new Uint8Array(buf);
		for (let i = 0, strLen = str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}
	async function sign(content, signingKey) {
		const buf = str2ab(content);
		const plainKey = signingKey
			.replace('-----BEGIN PRIVATE KEY-----', '')
			.replace('-----END PRIVATE KEY-----', '')
			.replace(/(\r\n|\n|\r)/gm, '');
		const binaryKey = str2ab(atob(plainKey));
		const signer = await crypto.subtle.importKey(
			'pkcs8',
			binaryKey,
			{
				name: 'RSASSA-PKCS1-V1_5',
				hash: { name: 'SHA-256' },
			},
			false,
			['sign']
		);
		const binarySignature = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-V1_5' }, signer, buf);
		return arrayBufferToBase64Url(binarySignature);
	}

	const jwtHeader = objectToBase64url({ alg: 'RS256', typ: 'JWT' });
	try {
		const assertiontime = Math.round(Date.now() / 1000);
		const expirytime = assertiontime + 3600;
		const claimset = objectToBase64url({
			iss: user,
			scope: scope,
			aud: 'https://oauth2.googleapis.com/token',
			exp: expirytime,
			iat: assertiontime,
		});

		const jwtUnsigned = jwtHeader + '.' + claimset;
		const signedJwt = jwtUnsigned + '.' + (await sign(jwtUnsigned, key));
		const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + signedJwt;
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Cache-Control': 'no-cache',
				Host: 'oauth2.googleapis.com',
			},
			body: body,
		});
		const oauth = await response.json();
		return oauth.access_token;
	} catch (err) {
		console.log(err);
	}
}

export default getGoogleAuthToken;
