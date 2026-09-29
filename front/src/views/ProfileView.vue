<script setup>
import { reactive, ref } from 'vue';
import {
	changePassword,
	disableTwoFactor,
	enableTwoFactor,
	setupTwoFactor,
	updateProfile,
} from '../services/backApi.js';
import { session, updateSessionUser } from '../stores/session.js';

// Identité
const identity = reactive({
	first_name: session.user.first_name,
	last_name: session.user.last_name,
	email: session.user.email,
});
const identityMessage = ref('');
const identityError = ref('');

async function saveIdentity() {
	identityMessage.value = '';
	identityError.value = '';
	try {
		updateSessionUser(await updateProfile({ ...identity }));
		identityMessage.value = 'Fiche mise à jour.';
	} catch (e) {
		identityError.value = e.message;
	}
}

// Mot de passe
const passwords = reactive({ current: '', next: '', confirmation: '' });
const passwordMessage = ref('');
const passwordError = ref('');

async function savePassword() {
	passwordMessage.value = '';
	passwordError.value = '';
	if (passwords.next !== passwords.confirmation) {
		passwordError.value = 'Les deux nouveaux mots de passe ne correspondent pas.';
		return;
	}
	try {
		await changePassword(passwords.current, passwords.next);
		Object.assign(passwords, { current: '', next: '', confirmation: '' });
		passwordMessage.value = 'Mot de passe changé.';
	} catch (e) {
		passwordError.value = e.message;
	}
}

// Double authentification
const setup = ref(null);
const code = ref('');
const twoFactorError = ref('');

async function startSetup() {
	twoFactorError.value = '';
	try {
		setup.value = await setupTwoFactor();
	} catch (e) {
		twoFactorError.value = e.message;
	}
}

async function confirmTwoFactor() {
	twoFactorError.value = '';
	try {
		const user = session.user.totp_enabled
			? await disableTwoFactor(code.value.trim())
			: await enableTwoFactor(code.value.trim());
		updateSessionUser(user);
		setup.value = null;
		code.value = '';
	} catch (e) {
		twoFactorError.value = e.message;
	}
}
</script>

<template>
	<section class="page">
		<h1>Fiche de personnage</h1>

		<form class="parchment panel" @submit.prevent="saveIdentity">
			<h2>Identité</h2>
			<label>
				Prénom
				<input v-model="identity.first_name" autocomplete="given-name" required />
			</label>
			<label>
				Nom
				<input v-model="identity.last_name" autocomplete="family-name" required />
			</label>
			<label>
				Email
				<input v-model="identity.email" type="email" autocomplete="email" required />
			</label>
			<p v-if="identityError" class="error">{{ identityError }}</p>
			<p v-if="identityMessage" class="success">{{ identityMessage }}</p>
			<button class="btn">Mettre à jour la fiche</button>
		</form>

		<form class="parchment panel" @submit.prevent="savePassword">
			<h2>Mot de passe</h2>
			<label>
				Mot de passe actuel
				<input v-model="passwords.current" type="password" autocomplete="current-password" required />
			</label>
			<label>
				Nouveau mot de passe
				<input v-model="passwords.next" type="password" autocomplete="new-password" minlength="8" required />
			</label>
			<label>
				Confirmation
				<input v-model="passwords.confirmation" type="password" autocomplete="new-password" required />
			</label>
			<p v-if="passwordError" class="error">{{ passwordError }}</p>
			<p v-if="passwordMessage" class="success">{{ passwordMessage }}</p>
			<button class="btn">Changer le mot de passe</button>
		</form>

		<div class="parchment panel">
			<h2>Double authentification</h2>

			<template v-if="session.user.totp_enabled">
				<p>Le sceau est actif : un code vous est demandé à chaque connexion.</p>
				<form class="toolbar" @submit.prevent="confirmTwoFactor">
					<input v-model="code" class="code-input" inputmode="numeric" maxlength="6" placeholder="Code actuel" required />
					<button class="btn btn-ghost">Désactiver</button>
				</form>
			</template>

			<template v-else-if="setup">
				<p>
					Ajoutez ce compte dans votre application d'authentification (Google Authenticator,
					Microsoft Authenticator…) en scannant le QR code ou en saisissant la clé.
				</p>
				<img v-if="setup.qr_code" :src="setup.qr_code" alt="QR code de la double authentification" class="qr-code" />
				<p>Clé : <code>{{ setup.secret }}</code></p>
				<form class="toolbar" @submit.prevent="confirmTwoFactor">
					<input v-model="code" class="code-input" inputmode="numeric" maxlength="6" placeholder="Code à 6 chiffres" required />
					<button class="btn">Activer</button>
				</form>
			</template>

			<template v-else>
				<p>Protégez votre compte : en plus du mot de passe, un code à usage unique vous sera demandé à la connexion.</p>
				<button class="btn" @click="startSetup">Poser un sceau</button>
			</template>

			<p v-if="twoFactorError" class="error">{{ twoFactorError }}</p>
		</div>
	</section>
</template>
