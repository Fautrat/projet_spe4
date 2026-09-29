<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fileUrl, getDocument, replaceFile, saveDocument } from '../services/backApi.js';
import { connect } from '../services/websocket.js';
import { session } from '../stores/session.js';
import { formatDate, formatSize } from '../utils/format.js';
import { diff, shift } from '../utils/textDiff.js';

const route = useRoute();

const doc = ref(null);
const text = ref('');
const status = ref('');
const saveFailed = ref(false);
const error = ref('');
const textarea = ref(null);

let saveTimer = null;

// Édition à plusieurs : on envoie tout le texte aux autres à chaque frappe
// et le serveur websocket sauvegarde en BDD toutes les 10s.
// Si le websocket ne marche pas, on sauvegarde nous-mêmes avec l'API.
let socket = null;
let joined = false;

function openSocket() {
	socket = connect(onMessage);
	socket.onopen = () => socket.sendJson({ type: 'join', id: doc.value.id, userId: session.user?.id });
	socket.onclose = () => (joined = false);
}

function onMessage(message) {
	if (message.type === 'joined') {
		joined = true;
		receiveContent(message.content);
	} else if (message.type === 'content') {
		receiveContent(message.text);
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
	nextTick(() => {
		if (document.activeElement === el) el.setSelectionRange(start, end);
	});
}

const backLink = computed(() => {
	if (doc.value && doc.value.folder_id) {
		return { name: 'library', params: { folderId: doc.value.folder_id } };
	}
	return { name: 'library' };
});

const isImage = computed(() => doc.value?.mime_type?.startsWith('image/'));
const isPdf = computed(() => doc.value?.mime_type === 'application/pdf');

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

function onInput() {
	status.value = 'Modifications en cours…';

	if (joined) {
		socket.sendJson({ type: 'content', text: text.value });
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
			<h1>{{ doc.name }}</h1>
			<span class="status">{{ status }}</span>
			<button v-if="saveFailed" class="btn btn-ghost" @click="save">Réessayer</button>
		</div>
		<p class="meta">Modifié le {{ formatDate(doc.updated_at) }} par {{ doc.updated_by_name }}</p>

		<p v-if="error" class="error">{{ error }}</p>

		<textarea
			v-if="!doc.file_path"
			ref="textarea"
			v-model="text"
			class="parchment editor"
			placeholder="Il était une fois…"
			@input="onInput"
		></textarea>

		<div v-else class="parchment file">
			<img v-if="isImage" :src="fileUrl(doc)" :alt="doc.name" />
			<iframe v-else-if="isPdf" :src="fileUrl(doc)" :title="doc.name"></iframe>
			<p v-else class="no-preview">Pas d'aperçu pour ce type de fichier : téléchargez-le pour l'ouvrir.</p>

			<div class="file-footer">
				<span>{{ formatSize(doc.file_size) }}</span>
				<div class="toolbar">
					<a :href="fileUrl(doc)" :download="doc.name" class="btn btn-ghost">Télécharger</a>
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
