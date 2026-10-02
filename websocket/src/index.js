import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { getRoomUsers, joinRoom, kick, leaveRoom, sendToRoom, roomExists } from './rooms.js';
import { canAccess, docs, getDoc, saveDoc } from './documents.js';
import { addMessage, getMessages } from './messages.js';

const PORT = Number(process.env.PORT) || 3001;

// Route interne POST /kick, appelée par le back avec un jeton { purpose: 'kick' } :
// elle sort de leur room un compte bloqué, une personne retirée d'un document ou tout le monde d'un document supprimé
const server = createServer((req, res) => {
	if (req.method !== 'POST' || req.url !== '/kick') {
		res.writeHead(404).end();
		return;
	}
	let body = '';
	req.on('data', (chunk) => {
		body += chunk;
	});
	req.on('end', () => {
		try {
			const payload = jwt.verify(req.headers.authorization?.split(' ')[1], process.env.JWT_SECRET);
			if (payload.purpose !== 'kick') throw new Error('Jeton refusé');
			const { userId, documentId, reason } = JSON.parse(body);
			kick(userId, documentId, reason);
			res.writeHead(204).end();
		} catch {
			res.writeHead(401).end();
		}
	});
});

// 2 Mo maximum par message, comme le JSON accepté par le back
const wss = new WebSocketServer({ server, maxPayload: 2 * 1024 * 1024 });

// Seuls ces messages venant d'un client sont renvoyés aux autres, les autres types sont réservés au serveur
function isRelayed(type) {
	return type === 'content' || type === 'cursor' || (typeof type === 'string' && type.startsWith('voice-'));
}

async function save(id) {
	try {
		const saved = await saveDoc(id);
		if (saved) {
			sendToRoom(id, {
				type: 'saved',
				updated_at: saved.updated_at,
				updated_by_name: `${saved.first_name} ${saved.last_name}`,
			});
		}
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

wss.on('connection', (ws, req) => {
	const token = new URL(req.url, 'http://localhost').searchParams.get('token');
	try {
		const user = jwt.verify(token, process.env.JWT_SECRET);
		// le jeton temporaire de la 2FA ne vaut pas connexion
		if (user.purpose) throw new Error('Jeton temporaire');
		ws.userId = user.id;
		ws.userName = `${user.first_name} ${user.last_name}`;
	} catch {
		ws.close(4001, 'Token invalide');
		return;
	}

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
			message.id = Number(message.id);

			let doc = null;
			let messages = [];
			try {
				if (await canAccess(message.id, ws.userId)) {
					doc = await getDoc(message.id);
					messages = await getMessages(message.id);
				}
			} catch (err) {
				console.error(err.message);
			}
			if (!doc) {
				ws.send(JSON.stringify({ type: 'error', error: 'Document introuvable' }));
				return;
			}

			joinRoom(ws, message.id);

			ws.send(JSON.stringify({ type: 'joined', id: message.id, clientId: ws.id, content: doc.text, messages }));
			sendToRoom(ws.room, { type: 'room-users', users: getRoomUsers(ws.room) });
			sendToRoom(ws.room, { type: 'user-joined' }, ws);
			return;
		}

		if (!ws.room) {
			ws.send(JSON.stringify({ type: 'error', error: 'Rejoins un document d’abord' }));
			return;
		}

		// messagerie : enregistrée en base puis envoyée à toute la room, auteur compris
		if (message.type === 'chat') {
			const room = ws.room;
			const content = typeof message.text === 'string' ? message.text.trim() : '';
			if (!content || content.length > 2000) return;
			try {
				sendToRoom(room, { type: 'chat', message: await addMessage(room, ws.userId, content) });
			} catch (err) {
				console.error(err.message);
				ws.send(JSON.stringify({ type: 'error', error: 'Message non envoyé' }));
			}
			return;
		}

		if (!isRelayed(message.type)) return;

		if (message.type === 'content') {
			if (typeof message.text !== 'string') return;
			const room = ws.room;
			const doc = docs.get(room);
			doc.text = message.text;
			doc.changed = true;
			doc.userId = ws.userId;

			// on enregistre 1,5 s après la dernière frappe
			clearTimeout(doc.saveTimer);
			doc.saveTimer = setTimeout(() => save(room), 1500);
		}

		if (message.type === 'cursor' || message.type === 'content') message.name = ws.userName;

		message.from = ws.id;
		message.userId = ws.userId;
		sendToRoom(ws.room, message, ws);
	});

	ws.on('close', () => leave(ws));
});

server.listen(PORT, () => {
	console.log(`Serveur WebSocket démarré sur ws://localhost:${PORT}`);
});
