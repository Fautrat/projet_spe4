import { reactive } from 'vue';

const saved = JSON.parse(localStorage.getItem('session') || 'null');

export const session = reactive({
	user: saved ? saved.user : null,
	token: saved ? saved.token : null,
});

export function openSession(user, token) {
	session.user = user;
	session.token = token;
	localStorage.setItem('session', JSON.stringify({ user, token }));
}

export function closeSession() {
	session.user = null;
	session.token = null;
	localStorage.removeItem('session');
}
