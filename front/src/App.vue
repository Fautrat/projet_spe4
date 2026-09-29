<script setup>
import { useRouter } from 'vue-router';
import { logout } from './services/backApi.js';
import { closeSession, session } from './stores/session.js';

const router = useRouter();

async function onLogout() {
	try {
		await logout();
	} catch {
		// Si le serveur ne répond pas, on ferme quand même la session locale.
	}
	closeSession();
	router.push({ name: 'login' });
}
</script>

<template>
	<header v-if="session.user" class="topbar">
		<RouterLink to="/library" class="logo">Le Grimoire</RouterLink>

		<nav>
			<RouterLink to="/library">Bibliothèque</RouterLink>
			<RouterLink v-if="session.user.role === 'admin'" to="/users">Aventuriers</RouterLink>
		</nav>

		<div class="whoami">
			<span>{{ session.user.first_name }} {{ session.user.last_name }}</span>
			<small>{{ session.user.role === 'admin' ? 'Maître du jeu' : 'Aventurier' }}</small>
		</div>

		<button class="btn btn-ghost" @click="onLogout">Quitter</button>
	</header>

	<main>
		<RouterView />
	</main>
</template>
