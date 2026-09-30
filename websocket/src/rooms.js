import { WebSocket } from 'ws';

const rooms = new Map();

export function joinRoom(ws, name) {
	if (!rooms.has(name)) rooms.set(name, new Set());
	rooms.get(name).add(ws);
	ws.room = name;
}

export function leaveRoom(ws) {
	const roomName = ws.room;
	const room = rooms.get(roomName);
	if (!room) return;

	// pour que les autres enlèvent son curseur
	sendToRoom(ws.room, { type: 'cursor-leave', from: ws.id }, ws);

	room.delete(ws);
	if (room.size === 0) {
		rooms.delete(roomName);
	} else {
		sendToRoom(roomName, { type: 'room-users', users: getRoomUsers(roomName) });
	}
	ws.room = null;
}

export function getRoomUsers(name) {
	const room = rooms.get(name);
	if (!room) return [];

	return [...room].map((client) => ({ id: client.id, name: client.userName || 'Anonyme' }));
}

export function roomExists(name) {
	return rooms.has(name);
}

// envoie à tout le monde dans la room, sauf à except
export function sendToRoom(name, message, except = null) {
	const room = rooms.get(name);
	if (!room) return;

	for (const client of room) {
		if (client !== except && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(message));
		}
	}
}
