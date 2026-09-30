<script setup>
import { computed } from 'vue';

// Bouton d'appel audio d'un document : voice vient de createVoice (webRTC/voice.js).

const props = defineProps({ voice: { type: Object, required: true } });

const state = props.voice.state;

const ringing = computed(() => Object.keys(state.callers).length > 0);

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
</template>
