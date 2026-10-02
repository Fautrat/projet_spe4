<script setup>
import { computed } from 'vue';

// Bouton d'appel audio d'un document : voice vient de createVoice (webRTC/voice.js)
const props = defineProps({
	voice: { type: Object, required: true },
	users: { type: Array, default: () => [] },
});

const state = props.voice.state;

const ringing = computed(() => Object.keys(state.callers).length > 0);

// Liste des appels : les personnes qui ont rejoint l'appel, avec leur heure d'arrivée
const calls = computed(() => Object.entries(state.callers).map(([id, since]) => ({
	id,
	name: props.users.find((user) => user.id === id)?.name || 'Aventurier inconnu',
	time: new Date(since).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
})));

const status = computed(() => {
	if (state.error) return `Micro : ${state.error}`;

	if (state.inCall) {
		const count = Object.keys(state.streams).length;
		return count ? `En appel avec ${count} personne(s)` : 'En attente des autres…';
	}
	return ringing.value ? 'Appel en cours sur ce document' : '';
});
</script>

<template>
	<div class="toolbar">
		<button v-if="!state.inCall" class="btn" @click="voice.start()">
			{{ ringing ? 'Rejoindre l’appel' : 'Appeler' }}
		</button>
		<button v-else class="btn btn-ghost" @click="voice.stop()">Raccrocher</button>
		<span class="meta">{{ status }}</span>

		<audio v-for="(stream, id) in state.streams" :key="id" :srcObject.prop="stream" autoplay></audio>
	</div>

	<!-- Liste des appels -->
	<ul v-if="calls.length" class="call-list">
		<li v-for="call in calls" :key="call.id">
			<strong>{{ call.name }}</strong>
			<span>depuis {{ call.time }}</span>
		</li>
	</ul>
</template>

<style scoped>
.call-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.call-list li {
	display: flex;
	gap: 0.4rem;
	padding: 0.15rem 0.6rem;
	border: 1px solid rgba(212, 174, 85, 0.5);
	border-radius: 999px;
	font-size: 0.9rem;
}

.call-list span {
	color: var(--ink-light);
}
</style>
