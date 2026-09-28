import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT) || 3001;

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
	socket.on('message', (data) => {
		for (const client of wss.clients) {
			if (client !== socket && client.readyState === WebSocket.OPEN) {
				client.send(data.toString());
			}
		}
	});
});

console.log(`Serveur WebSocket démarré sur ws://localhost:${PORT}`);
