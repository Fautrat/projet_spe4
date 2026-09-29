import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { joinRoom, leaveRoom, broadcastToRoom } from './rooms.js';
import { files, getDoc, updateDoc } from './documents.js';

const PORT = Number(process.env.PORT) || 3001;
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
	console.log(`Client ${ws._socket.remoteAddress} connecté`);
	ws.id = randomUUID();
	ws.room = null;

	ws.send(JSON.stringify({ type: 'files', files }));

	ws.on('message', (data) => {
		let message;
		try {
			message = JSON.parse(data.toString());
		} catch {
			ws.send(JSON.stringify({ type: 'error', error: 'JSON invalide' }));
			return;
		}

		if (message.type === 'join') {
			if (!files.includes(message.room)) {
				ws.send(JSON.stringify({ type: 'error', error: 'Fichier introuvable' }));
				return;
			}

			joinRoom(ws, message.room);

			const state = Y.encodeStateAsUpdate(getDoc(ws.room));
			ws.send(JSON.stringify({ type: 'joined', room: ws.room, state: Buffer.from(state).toString('base64') }));
			broadcastToRoom(ws, { type: 'user-joined' });
			return;
		}

		if (message.type === 'leave') {
			leaveRoom(ws);
			return;
		}

		if (!ws.room) {
			ws.send(JSON.stringify({ type: 'error', error: 'Rejoins une room d’abord' }));
			return;
		}

		if (message.type === 'update') {
			updateDoc(ws.room, Buffer.from(message.update, 'base64'));
		}

		message.from = ws.id;
		broadcastToRoom(ws, message);
	});

	ws.on('close', () => leaveRoom(ws));
});

console.log(`Serveur WebSocket démarré sur ws://localhost:${PORT}`);
