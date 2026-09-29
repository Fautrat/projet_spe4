<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fileUrl, getDocument, replaceFile, saveDocument } from '../services/backApi.js';
import { formatDate, formatSize } from '../utils/format.js';

const route = useRoute();

const doc = ref(null);
const text = ref('');
const status = ref('');
const saveFailed = ref(false);
const error = ref('');

let saveTimer = null;

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
	clearTimeout(saveTimer);
	saveTimer = setTimeout(save, 1000);
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
