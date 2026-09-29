<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../services/backApi.js';
import { openSession } from '../stores/session.js';

const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
	error.value = '';
	loading.value = true;
	try {
		const { user, token } = await login(email.value, password.value);
		openSession(user, token);
		router.push({ name: 'library' });
	} catch (e) {
		error.value = e.message;
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="login">
		<form class="parchment login-card" @submit.prevent="onSubmit">
			<h1>Le Grimoire</h1>
			<p class="subtitle">Halte, voyageur. Déclinez votre identité.</p>

			<label>
				Email
				<input v-model="email" type="email" autocomplete="username" required />
			</label>

			<label>
				Mot de passe
				<input v-model="password" type="password" autocomplete="current-password" required />
			</label>

			<p v-if="error" class="error">{{ error }}</p>

			<button class="btn" :disabled="loading">Franchir la porte</button>

			<p class="switch">
				Pas encore de compte ?
				<RouterLink :to="{ name: 'register' }">Rejoindre la guilde</RouterLink>
			</p>
		</form>
	</div>
</template>
