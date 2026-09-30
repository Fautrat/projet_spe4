<script setup>
import { onMounted, reactive, ref } from 'vue';
import { createUser, getUsers, setUserBlocked, setUserRole } from '../services/backApi.js';
import { session } from '../stores/session.js';

const users = ref([]);
const error = ref('');
const showForm = ref(false);

const form = reactive({
	first_name: '',
	last_name: '',
	email: '',
	password: '',
});

async function load() {
	try {
		users.value = await getUsers();
	} catch (e) {
		error.value = e.message;
	}
}

async function addUser() {
	error.value = '';
	try {
		await createUser({ ...form });
		Object.assign(form, { first_name: '', last_name: '', email: '', password: '' });
		showForm.value = false;
		load();
	} catch (e) {
		error.value = e.message;
	}
}

async function toggleBlocked(user) {
	error.value = '';
	try {
		await setUserBlocked(user.id, !user.is_blocked);
		load();
	} catch (e) {
		error.value = e.message;
	}
}

async function toggleRole(user) {
	error.value = '';
	try {
		await setUserRole(user.id, user.role === 'admin' ? 'user' : 'admin');
		load();
	} catch (e) {
		error.value = e.message;
	}
}

onMounted(load);
</script>

<template>
	<section class="page">
		<div class="doc-header">
			<h1>Registre des aventuriers</h1>
			<button class="btn" @click="showForm = !showForm">
				{{ showForm ? 'Annuler' : 'Recruter un aventurier' }}
			</button>
		</div>

		<form v-if="showForm" class="parchment user-form" @submit.prevent="addUser">
			<label>
				Prénom
				<input v-model="form.first_name" required />
			</label>
			<label>
				Nom
				<input v-model="form.last_name" required />
			</label>
			<label>
				Email
				<input v-model="form.email" type="email" required />
			</label>
			<label>
				Mot de passe provisoire
				<input v-model="form.password" type="password" minlength="8" required />
			</label>
			<button class="btn">Inscrire au registre</button>
		</form>

		<p v-if="error" class="error">{{ error }}</p>

		<table class="parchment">
			<thead>
				<tr>
					<th>Nom</th>
					<th>Email</th>
					<th>Rôle</th>
					<th>Statut</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="user in users" :key="user.id" :class="{ banned: user.is_blocked }">
					<td>{{ user.first_name }} {{ user.last_name }}</td>
					<td>{{ user.email }}</td>
					<td>{{ user.role === 'admin' ? 'Maître du jeu' : 'Aventurier' }}</td>
					<td>{{ user.is_blocked ? 'Banni' : 'Actif' }}</td>
					<td>
						<div v-if="user.id !== session.user.id" class="row-actions">
							<button class="link-danger" @click="toggleRole(user)">
								{{ user.role === 'admin' ? 'Destituer' : 'Adouber' }}
							</button>
							<button class="link-danger" @click="toggleBlocked(user)">
								{{ user.is_blocked ? 'Gracier' : 'Bannir' }}
							</button>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>
