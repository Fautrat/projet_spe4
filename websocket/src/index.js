import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { joinRoom, leaveRoom, sendToRoom, roomExists } from './rooms.js';
import { docs, getDoc, saveDoc } from './documents.js';

const PORT = Number(process.env.PORT) || 3001;
const wss = new WebSocketServer({ port: PORT });

async function save(id) {
	try {
		if (await saveDoc(id)) sendToRoom(id, { type: 'saved' });
	} catch (err) {
		console.error(err.message);
		sendToRoom(id, { type: 'save-error' });
	}
}

// toutes les 10s on sauvegarde les documents modifiés
setInterval(() => {
	for (const id of docs.keys()) save(id);
}, 10000);

async function leave(ws) {
	const id = ws.room;
	leaveRoom(ws);

	// le dernier est parti : on sauvegarde et on libère la mémoire
	if (id && !roomExists(id)) {
		await save(id);
		if (!roomExists(id)) docs.delete(id);
	}
}

wss.on('connection', (ws) => {
	console.log(`Client ${ws._socket.remoteAddress} connecté`);
	ws.id = randomUUID();
	ws.room = null;

	ws.on('message', async (data) => {
		let message;
		try {
			message = JSON.parse(data);
		} catch {
			return;
		}

		if (message.type === 'join') {
			await leave(ws);

			let doc = null;
			try {
				doc = await getDoc(message.id);
			} catch (err) {
				console.error(err.message);
			}
			if (!doc) {
				ws.send(JSON.stringify({ type: 'error', error: 'Document introuvable' }));
				return;
			}

			// TODO: prendre l'id dans le token quand l'auth sera faite
			ws.userId = message.userId;
			joinRoom(ws, message.id);

			ws.send(JSON.stringify({ type: 'joined', id: message.id, content: doc.text }));
			sendToRoom(ws.room, { type: 'user-joined' }, ws);
			return;
		}

		if (!ws.room) {
			ws.send(JSON.stringify({ type: 'error', error: 'Rejoins un document d’abord' }));
			return;
		}

		if (message.type === 'content') {
			const doc = docs.get(ws.room);
			doc.text = message.text;
			doc.changed = true;
			doc.userId = ws.userId;
		}

		message.from = ws.id;
		sendToRoom(ws.room, message, ws);
	});

	ws.on('close', () => leave(ws));
});

console.log(`Serveur WebSocket démarré sur ws://localhost:${PORT}`);
