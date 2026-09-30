<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue';
import VoiceCall from '../components/VoiceCall.vue';
import { getFolder } from '../services/backApi.js';
import { connect, me } from '../services/websocket.js';
import { session } from '../stores/session.js';
import { diff, shift } from '../utils/textDiff.js';
import { createVoice } from '../webRTC/voice.js';

// Édition : on choisit un document et on l'édite à plusieurs, avec les curseurs des autres.

const connected = ref(false);
const files = ref([]);
const current = ref(null); // id du document ouvert
const savedAt = ref('');
const text = ref('');
const cursors = reactive({}); // id du client -> { name, color, index }
const messages = ref([]);

const textarea = ref(null);
const cursorsDiv = ref(null);

getFolder()
	.then((library) => (files.value = library.documents.filter((doc) => !doc.file_path)))
	.catch((e) => messages.value.push(e.message));

const socket = connect(onMessage);
socket.onopen = () => (connected.value = true);
socket.onclose = () => (connected.value = false);

const voice = createVoice(socket);

async function onMessage(message) {
	if (await voice.onMessage(message)) return;

	if (message.type === 'joined') {
		voice.reset();
		current.value = message.id;
		text.value = message.content;
		for (const id in cursors) delete cursors[id];
	} else if (message.type === 'content') {
		receiveContent(message.text);
	} else if (message.type === 'cursor') {
		cursors[message.from] = { name: message.name, color: message.color, index: message.index };
	} else if (message.type === 'user-joined') {
		sendCursor();
	} else if (message.type === 'cursor-leave') {
		delete cursors[message.from];
	} else if (message.type === 'saved') {
		savedAt.value = new Date().toLocaleTimeString('fr-FR');
	} else {
		messages.value.push(`[${message.type}] ${message.error || ''}`);
	}
}

function join(file) {
	voice.stop();
	socket.sendJson({ type: 'join', id: file.id, userId: session.user?.id });
}

function moveCursors(change) {
	for (const cursor of Object.values(cursors)) {
		cursor.index = shift(cursor.index, change);
	}
}

function receiveContent(newText) {
	const el = textarea.value;
	const change = diff(text.value, newText);
	const start = shift(el.selectionStart, change);
	const end = shift(el.selectionEnd, change);

	text.value = newText;
	moveCursors(change);
	nextTick(() => {
		if (document.activeElement === el) el.setSelectionRange(start, end);
	});
}

function onInput(event) {
	moveCursors(diff(text.value, event.target.value));
	text.value = event.target.value;

	socket.sendJson({ type: 'content', text: text.value });
	sendCursor();
}

function sendCursor() {
	if (!current.value) return;
	socket.sendJson({ type: 'cursor', name: me.name, color: me.color, index: textarea.value.selectionStart });
}

function syncScroll() {
	cursorsDiv.value.scrollTop = textarea.value.scrollTop;
}

// Les curseurs sont dans une div derrière le textarea avec le même texte en transparent.
// On découpe le texte à la position de chaque curseur pour pouvoir insérer une barre.
const parts = computed(() => {
	const list = Object.entries(cursors).sort((a, b) => a[1].index - b[1].index);
	const result = [];
	let last = 0;

	for (const [id, cursor] of list) {
		result.push({ key: 'text-' + id, text: text.value.slice(last, cursor.index) });
		result.push({ key: 'cursor-' + id, cursor });
		last = cursor.index;
	}
	result.push({ key: 'end', text: text.value.slice(last) + '\n' });
	return result;
});

onBeforeUnmount(() => {
	voice.stop();
	socket.close();
});
</script>

<template>
	<section class="page">
		<h1>Édition</h1>
		<p class="meta">
			WebSocket : {{ connected ? 'connecté' : 'déconnecté' }}
			<span v-if="savedAt"> · Sauvegardé à {{ savedAt }}</span>
		</p>

		<div class="toolbar">
			<button
				v-for="file in files"
				:key="file.id"
				class="btn"
				:class="{ 'btn-ghost': file.id !== current }"
				@click="join(file)"
			>{{ file.name }}</button>
		</div>

		<VoiceCall v-if="current" :voice="voice" />

		<div class="ws-editor parchment">
			<!-- sur une seule ligne : un espace en trop décalerait les curseurs -->
			<div ref="cursorsDiv" class="ws-layer ws-cursors"><template v-for="part in parts" :key="part.key"><span v-if="part.cursor" class="ws-cursor" :style="{ borderColor: part.cursor.color }"><span class="ws-cursor-name" :style="{ background: part.cursor.color }">{{ part.cursor.name }}</span></span><template v-else>{{ part.text }}</template></template></div>
			<textarea
				ref="textarea"
				class="ws-layer ws-textarea"
				:value="text"
				:disabled="!current"
				placeholder="Choisis un fichier"
				@input="onInput"
				@keyup="sendCursor"
				@click="sendCursor"
				@focus="sendCursor"
				@scroll="syncScroll"
			></textarea>
		</div>

		<ul v-if="messages.length" class="error">
			<li v-for="(message, i) in messages" :key="i">{{ message }}</li>
		</ul>
	</section>
</template>

<style scoped>
/* textarea et curseurs l'un sur l'autre : même police et même padding obligatoire */
.ws-editor {
	position: relative;
	height: 60vh;
	padding: 0;
}

.ws-layer {
	position: absolute;
	inset: 0;
	margin: 0;
	padding: 1rem;
	border: none;
	box-sizing: border-box;
	font: 15px/1.6 monospace;
	white-space: pre-wrap;
	overflow-wrap: break-word;
	overflow-y: scroll;
}

.ws-textarea {
	background: transparent;
	resize: none;
}

.ws-cursors {
	color: transparent;
	pointer-events: none;
}

.ws-cursor {
	position: relative;
	border-left: 2px solid;
	margin-left: -1px;
}

.ws-cursor-name {
	position: absolute;
	bottom: 100%;
	left: -2px;
	padding: 0 4px;
	color: white;
	font-size: 10px;
	line-height: 1.4;
	white-space: nowrap;
}
</style>
