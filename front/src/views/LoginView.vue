<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login, verifyTwoFactor } from '../services/backApi.js';
import { openSession } from '../stores/session.js';

const router = useRouter();

const step = ref('credentials');
const email = ref('');
const password = ref('');
const code = ref('');
const error = ref('');
const loading = ref(false);

let tempToken = null;

function enter({ user, token }) {
	openSession(user, token);
	router.push({ name: 'library' });
}

async function submitCredentials() {
	const result = await login(email.value, password.value);
	if (result.requires_2fa) {
		tempToken = result.temp_token;
		step.value = 'code';
	} else {
		enter(result);
	}
}

async function submitCode() {
	enter(await verifyTwoFactor(tempToken, code.value.trim()));
}

async function onSubmit() {
	error.value = '';
	loading.value = true;
	try {
		if (step.value === 'credentials') {
			await submitCredentials();
		} else {
			await submitCode();
		}
	} catch (e) {
		error.value = e.message;
	} finally {
		loading.value = false;
	}
}

function backToCredentials() {
	step.value = 'credentials';
	code.value = '';
	error.value = '';
}
</script>

<template>
	<div class="login">
		<form class="parchment login-card" @submit.prevent="onSubmit">
			<h1>Le Grimoire</h1>

			<template v-if="step === 'credentials'">
				<p class="subtitle">Halte, voyageur. Déclinez votre identité.</p>

				<label>
					Email
					<input v-model="email" type="email" autocomplete="username" required />
				</label>

				<label>
					Mot de passe
					<input v-model="password" type="password" autocomplete="current-password" required />
				</label>
			</template>

			<template v-else>
				<p class="subtitle">Un sceau protège ce compte. Donnez le code affiché par votre application d'authentification.</p>

				<label>
					Code à 6 chiffres
					<input
						v-model="code"
						class="code-input"
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength="6"
						required
					/>
				</label>
			</template>

			<p v-if="error" class="error">{{ error }}</p>

			<button class="btn" :disabled="loading">
				{{ step === 'credentials' ? 'Franchir la porte' : 'Briser le sceau' }}
			</button>

			<p v-if="step === 'credentials'" class="switch">
				Pas encore de compte ?
				<RouterLink :to="{ name: 'register' }">Rejoindre la guilde</RouterLink>
			</p>
			<button v-else type="button" class="link-danger" @click="backToCredentials">
				Utiliser un autre compte
			</button>
		</form>
	</div>
</template>
