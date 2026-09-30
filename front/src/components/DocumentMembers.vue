<script setup>
import { ref } from 'vue';
import { getInvitableUsers, getMembers, inviteMember, removeMember } from '../services/backApi.js';
import { session } from '../stores/session.js';

// Invités d'un document : seul le créateur choisit qui inviter,
// parmi les comptes actifs ; une personne invitée peut se retirer elle-même

const props = defineProps({
	documentId: { type: Number, required: true },
	canInvite: { type: Boolean, default: false },
});

const open = ref(false);
const members = ref([]);
const invitable = ref([]);
const selectedEmail = ref('');
const error = ref('');
const sending = ref(false);

function initials(member) {
	return (member.first_name[0] + member.last_name[0]).toUpperCase();
}

async function loadInvitable() {
	if (props.canInvite) {
		invitable.value = await getInvitableUsers(props.documentId);
	}
}

async function invite() {
	error.value = '';
	sending.value = true;
	try {
		members.value.push(await inviteMember(props.documentId, selectedEmail.value));
		selectedEmail.value = '';
		await loadInvitable();
	} catch (e) {
		error.value = e.message;
	} finally {
		sending.value = false;
	}
}

async function remove(member) {
	error.value = '';
	try {
		await removeMember(props.documentId, member.id);
		members.value = members.value.filter((other) => other.id !== member.id);
		await loadInvitable();
	} catch (e) {
		error.value = e.message;
	}
}

Promise.all([getMembers(props.documentId), loadInvitable()])
	.then(([list]) => (members.value = list))
	.catch((e) => (error.value = e.message));
</script>

<template>
	<div class="members">
		<button class="btn btn-ghost" :aria-expanded="open" @click="open = !open">
			Invités<template v-if="members.length"> · {{ members.length }}</template>
		</button>

		<div v-if="open" class="parchment members-panel">
			<form v-if="canInvite" class="toolbar" @submit.prevent="invite">
				<select v-model="selectedEmail" aria-label="Personne à inviter" required>
					<option value="" disabled>Choisir un aventurier</option>
					<option v-for="user in invitable" :key="user.id" :value="user.email">
						{{ user.first_name }} {{ user.last_name }} ({{ user.email }})
					</option>
				</select>
				<button class="btn" :disabled="sending || !selectedEmail">Inviter</button>
			</form>

			<p v-if="error" class="error">{{ error }}</p>

			<ul v-if="members.length">
				<li v-for="member in members" :key="member.id">
					<span class="seal" aria-hidden="true">{{ initials(member) }}</span>
					<span class="who">
						{{ member.first_name }} {{ member.last_name }}
						<small>{{ member.email }}</small>
					</span>
					<button v-if="canInvite || member.id === session.user.id" class="link-danger" @click="remove(member)">
						{{ member.id === session.user.id ? 'Me retirer' : 'Retirer' }}
					</button>
				</li>
			</ul>
			<p v-else class="none">Aucun invité pour l'instant.</p>
		</div>
	</div>
</template>

<style scoped>
.members {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.8rem;
}

.members-panel {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	max-width: 560px;
	padding: 1.4rem 1.6rem;
}

ul {
	margin: 0;
	padding: 0;
	list-style: none;
}

li {
	display: flex;
	align-items: center;
	gap: 0.9rem;
	padding: 0.6rem 0;
	border-bottom: 1px dashed rgba(107, 86, 64, 0.5);
}

li:last-child {
	border-bottom: none;
}

/* sceau de cire aux initiales de l'invité */
.seal {
	display: grid;
	place-items: center;
	flex: none;
	width: 2.3rem;
	height: 2.3rem;
	background: radial-gradient(circle at 35% 30%, #b13a3a, var(--blood-dark));
	border-radius: 47% 53% 50% 50% / 52% 48% 52% 48%;
	box-shadow: inset 0 0 0 3px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.4);
	color: var(--parchment);
	font-family: var(--title);
	font-size: 0.75rem;
	font-weight: 700;
}

.who {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
	line-height: 1.25;
}

.who small {
	overflow: hidden;
	color: var(--ink-light);
	font-style: italic;
	text-overflow: ellipsis;
}

.none {
	margin: 0;
	color: var(--ink-light);
	font-style: italic;
}
</style>
