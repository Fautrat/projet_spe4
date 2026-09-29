<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../services/backApi.js';
import { openSession } from '../stores/session.js';

const router = useRouter();

const form = reactive({
	first_name: '',
	last_name: '',
	email: '',
	password: '',
	confirmation: '',
});
const error = ref('');
const loading = ref(false);

async function onSubmit() {
	error.value = '';
	if (form.password !== form.confirmation) {
		error.value = 'Les deux mots de passe ne correspondent pas.';
		return;
	}
	loading.value = true;
	try {
		const { user, token } = await register({
			first_name: form.first_name,
			last_name: form.last_name,
			email: form.email,
			password: form.password,
		});
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
			<h1>Rejoindre la guilde</h1>
			<p class="subtitle">Inscrivez votre nom au registre des aventuriers.</p>

			<label>
				Prénom
				<input v-model="form.first_name" autocomplete="given-name" required />
			</label>

			<label>
				Nom
				<input v-model="form.last_name" autocomplete="family-name" required />
			</label>

			<label>
				Email
				<input v-model="form.email" type="email" autocomplete="email" required />
			</label>

			<label>
				Mot de passe
				<input v-model="form.password" type="password" autocomplete="new-password" minlength="8" required />
			</label>

			<label>
				Confirmation du mot de passe
				<input v-model="form.confirmation" type="password" autocomplete="new-password" required />
			</label>

			<p v-if="error" class="error">{{ error }}</p>

			<button class="btn" :disabled="loading">Signer le registre</button>

			<p class="switch">
				Déjà membre ?
				<RouterLink :to="{ name: 'login' }">Se connecter</RouterLink>
			</p>
		</form>
	</div>
</template>
