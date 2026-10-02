import jwt from 'jsonwebtoken';

// Prévient le serveur websocket qu'il doit sortir quelqu'un d'une room
export async function kickFromWebsocket(target) {
	const url = process.env.WEBSOCKET_URL || 'http://localhost:3001';
	const token = jwt.sign({ purpose: 'kick' }, process.env.JWT_SECRET, { expiresIn: '1m' });
	try {
		await fetch(`${url}/kick`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify(target),
			signal: AbortSignal.timeout(2000),
		});
	} catch {

	}
}
