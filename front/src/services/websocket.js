import { WS_URL } from '../config/config.js';
import { session } from '../stores/session.js';

const colors = ['#b03a2e', '#1e8449', '#2471a3', '#d68910', '#7d3c98', '#c2185b'];

// nom et couleur de notre curseur chez les autres
export const me = {
	// relu à chaque envoi : l'utilisateur peut se connecter après le chargement de la page
	get name() {
		return session.user ? `${session.user.first_name} ${session.user.last_name}` : 'Anonyme';
	},
	color: colors[Math.floor(Math.random() * colors.length)],
};

export function connect(onMessage) {
	const socket = new WebSocket(WS_URL);
	socket.onmessage = (event) => onMessage(JSON.parse(event.data));

	socket.sendJson = (message) => {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	};
	return socket;
}
