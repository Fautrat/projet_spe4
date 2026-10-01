<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import DocumentMembers from '../components/DocumentMembers.vue';
import VoiceCall from '../components/VoiceCall.vue';
import { getDocument, loadFileUrl, replaceFile, saveDocument } from '../services/backApi.js';
import { connect, me } from '../services/websocket.js';
import { session } from '../stores/session.js';
import { formatDate, formatSize } from '../utils/format.js';
import { diff, shift } from '../utils/textDiff.js';
import { createVoice } from '../webRTC/voice.js';

const route = useRoute();

const doc = ref(null);
const text = ref('');
const status = ref('');
const saveFailed = ref(false);
const error = ref('');
const textarea = ref(null);
const cursorsDiv = ref(null);
const cursors = reactive({}); // id du client -> { name, color, index }
const roomUsers = ref([]);

let saveTimer = null;

// Édition à plusieurs : on envoie tout le texte aux autres à chaque frappe
// et le serveur websocket sauvegarde en BDD toutes les 10s.
// Si le websocket ne marche pas, on sauvegarde nous-mêmes avec l'API.
let socket = null;
const joined = ref(false);
const voice = shallowRef(null); // appel audio avec ceux qui ont le même document ouvert

function openSocket() {
	socket = connect(onMessage);
	socket.onopen = () => socket.sendJson({ type: 'join', id: doc.value.id, userId: session.user?.id, userName: me.name });
	socket.onclose = () => (joined.value = false);
	voice.value = createVoice(socket);
}

async function onMessage(message) {
	if (await voice.value.onMessage(message)) return;

	if (message.type === 'joined') {
		joined.value = true;
		roomUsers.value = [];
		for (const id in cursors) delete cursors[id];
		receiveContent(message.content);
		sendCursor();
	} else if (message.type === 'room-users') {
		roomUsers.value = message.users;
	} else if (message.type === 'content') {
		receiveContent(message.text);
	} else if (message.type === 'cursor') {
		// nos autres onglets ont aussi un curseur, on ne l'affiche pas
		if (session.user && message.userId === session.user.id) return;
		cursors[message.from] = { name: message.name, color: message.color, index: message.index };
	} else if (message.type === 'user-joined') {
		sendCursor();
	} else if (message.type === 'cursor-leave') {
		delete cursors[message.from];
	} else if (message.type === 'saved') {
		saveFailed.value = false;
		status.value = 'Enregistré';
	} else if (message.type === 'save-error') {
		saveFailed.value = true;
		status.value = 'Échec de l\'enregistrement';
	} else if (message.type === 'error') {
		error.value = message.error;
	}
}

function receiveContent(newText) {
	// on garde notre curseur au bon endroit malgré les modifs des autres
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

function moveCursors(change) {
	for (const cursor of Object.values(cursors)) {
		cursor.index = shift(cursor.index, change);
	}
}

function sendCursor() {
	if (!joined.value) return;
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

// Une personne avec plusieurs onglets ouverts n'apparaît qu'une fois
const presentUsers = computed(() => {
	const byAccount = new Map();
	for (const user of roomUsers.value) byAccount.set(user.userId ?? user.id, user);
	return [...byAccount.values()];
});

const backLink = computed(() => {
	if (doc.value && doc.value.folder_id) {
		return { name: 'library', params: { folderId: doc.value.folder_id } };
	}
	return { name: 'library' };
});

const isImage = computed(() => doc.value?.mime_type?.startsWith('image/'));
const isPdf = computed(() => doc.value?.mime_type === 'application/pdf');

// Adresse locale du fichier, rechargée à l'ouverture et après chaque remplacement.
const fileSrc = ref('');

watch(() => doc.value?.file_path, async (filePath) => {
	if (fileSrc.value) {
		URL.revokeObjectURL(fileSrc.value);
		fileSrc.value = '';
	}
	if (filePath) {
		try {
			fileSrc.value = await loadFileUrl(doc.value);
		} catch (e) {
			error.value = e.message;
		}
	}
});

async function load() {
	try {
		doc.value = await getDocument(route.params.id);
		text.value = doc.value.content || '';
		if (!doc.value.file_path) openSocket();
	} catch (e) {
		error.value = e.message;
	}
}

async function save() {
	saveTimer = null;
	saveFailed.value = false;
	status.value = 'L\'encre sèche…';
	try {
		doc.value = await saveDocument(doc.value.id, text.value);
		status.value = 'Enregistré';
	} catch {
		saveFailed.value = true;
		status.value = 'Échec de l\'enregistrement';
	}
}

function onInput(event) {
	moveCursors(diff(text.value, event.target.value));
	text.value = event.target.value;
	status.value = 'Modifications en cours…';

	if (joined.value) {
		socket.sendJson({ type: 'content', text: text.value });
		sendCursor();
	} else {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, 1000);
	}
}

async function onReplace(event) {
	const file = event.target.files[0];
	event.target.value = '';
	if (!file) {
		return;
	}
	try {
		doc.value = await replaceFile(doc.value.id, file);
	} catch (e) {
		error.value = e.message;
	}
}

onBeforeUnmount(() => {
	voice.value?.stop();
	socket?.close();
	if (saveTimer) {
		clearTimeout(saveTimer);
		save();
	}
});

load();
</script>

<template>
	<section v-if="doc" class="page">
		<RouterLink :to="backLink" class="back">← Retour à la bibliothèque</RouterLink>

		<div class="doc-header">
			<div class="doc-title-room">
				<h1>{{ doc.name }}</h1>
				<div v-if="joined" class="room-users">
					<strong>Dans cette room ({{ presentUsers.length }})</strong>
					<ul>
						<li v-for="user in presentUsers" :key="user.id" :class="{ 'room-user-self': user.userId === session.user?.id }">{{ user.name }}</li>
					</ul>
				</div>
			</div>
			<span class="status">{{ status }}</span>
			<button v-if="saveFailed" class="btn btn-ghost" @click="save">Réessayer</button>
		</div>
		<p class="meta">Modifié le {{ formatDate(doc.updated_at) }} par {{ doc.updated_by_name }}</p>

		<p v-if="error" class="error">{{ error }}</p>

		<VoiceCall v-if="voice" :voice="voice" />
		<DocumentMembers :document-id="doc.id" :can-invite="doc.created_by === session.user.id" />

		<div v-if="!doc.file_path" class="parchment doc-editor">
			<!-- sur une seule ligne : un espace en trop décalerait les curseurs -->
			<div ref="cursorsDiv" class="doc-layer doc-cursors"><template v-for="part in parts" :key="part.key"><span v-if="part.cursor" class="doc-cursor" :style="{ borderColor: part.cursor.color }"><span class="doc-cursor-name" :style="{ background: part.cursor.color }">{{ part.cursor.name }}</span></span><template v-else>{{ part.text }}</template></template></div>
			<textarea
				ref="textarea"
				class="doc-layer doc-textarea"
				:value="text"
				placeholder="Il était une fois…"
				@input="onInput"
				@keyup="sendCursor"
				@click="sendCursor"
				@focus="sendCursor"
				@scroll="syncScroll"
			></textarea>
		</div>

		<div v-else class="parchment file">
			<img v-if="isImage && fileSrc" :src="fileSrc" :alt="doc.name" />
			<iframe v-else-if="isPdf && fileSrc" :src="fileSrc" :title="doc.name"></iframe>
			<p v-else class="no-preview">Pas d'aperçu pour ce type de fichier : téléchargez-le pour l'ouvrir.</p>

			<div class="file-footer">
				<span>{{ formatSize(doc.file_size) }}</span>
				<div class="toolbar">
					<a v-if="fileSrc" :href="fileSrc" :download="doc.name" class="btn btn-ghost">Télécharger</a>
					<label class="btn">
						Remplacer le fichier
						<input type="file" hidden @change="onReplace" />
					</label>
				</div>
			</div>
		</div>
	</section>

	<section v-else-if="error" class="page">
		<p class="error">{{ error }}</p>
		<RouterLink :to="{ name: 'library' }">← Retour à la bibliothèque</RouterLink>
	</section>
</template>

<style scoped>
.doc-title-room {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 1rem;
}

.room-users {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.4rem 0.75rem;
	padding-left: 0.8rem;
	border-left: 1px solid var(--gold);
	font-size: 0.9rem;
}

.room-users ul {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.room-users li {
	padding: 0.1rem 0.5rem;
	border: 1px solid rgba(212, 174, 85, 0.5);
	border-radius: 999px;
}

.room-users li.room-user-self {
	background: var(--gold);
	color: var(--leather);
	font-weight: 700;
}

/* textarea et curseurs l'un sur l'autre : même police et même padding obligatoire */
.doc-editor {
	position: relative;
	height: 60vh;
}

.doc-layer {
	position: absolute;
	inset: 0;
	margin: 0;
	padding: 2rem 2.5rem;
	border: none;
	box-sizing: border-box;
	font-family: var(--text);
	font-size: 1.15rem;
	line-height: 1.7;
	letter-spacing: normal;
	white-space: pre-wrap;
	overflow-wrap: break-word;
	overflow-y: scroll;
}

.doc-textarea {
	background: transparent;
	color: var(--ink);
	resize: none;
}

.doc-cursors {
	color: transparent;
	pointer-events: none;
}

.doc-cursor {
	position: relative;
	border-left: 2px solid;
	margin-left: -1px;
}

.doc-cursor-name {
	position: absolute;
	bottom: 100%;
	left: -2px;
	padding: 0 4px;
	color: white;
	font: 11px/1.4 sans-serif;
	white-space: nowrap;
}
</style>
