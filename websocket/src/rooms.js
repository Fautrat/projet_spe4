import { WebSocket } from 'ws';

const rooms = new Map();

export function joinRoom(ws, name) {
	leaveRoom(ws);

	if (!rooms.has(name)) rooms.set(name, new Set());
	rooms.get(name).add(ws);
	ws.room = name;
}

export function leaveRoom(ws) {
	const room = rooms.get(ws.room);
	if (!room) return;

	// pour que les autres enlèvent son curseur
	broadcastToRoom(ws, { type: 'cursor-leave', from: ws.id });

	room.delete(ws);
	if (room.size === 0) rooms.delete(ws.room);
	ws.room = null;
}

export function broadcastToRoom(sender, message) {
	const room = rooms.get(sender.room);
	if (!room) return;

	for (const client of room) {
		if (client !== sender && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(message));
		}
	}
}
