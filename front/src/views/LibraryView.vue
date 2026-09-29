<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
	createDocument,
	createFolder,
	deleteDocument,
	deleteFolder,
	getFolder,
	uploadFile,
} from '../services/backApi.js';
import { formatDate } from '../utils/format.js';

const route = useRoute();
const router = useRouter();

const library = ref(null);
const newName = ref('');
const error = ref('');

async function load() {
	error.value = '';
	try {
		library.value = await getFolder(route.params.folderId);
	} catch (e) {
		error.value = e.message;
	}
}

watch(() => route.params.folderId, load, { immediate: true });

function currentFolderId() {
	return library.value.folder ? library.value.folder.id : null;
}

async function run(action) {
	error.value = '';
	try {
		await action();
		await load();
	} catch (e) {
		error.value = e.message;
	}
}

function addFolder() {
	const name = newName.value.trim();
	if (!name) {
		return;
	}
	run(async () => {
		await createFolder(name, currentFolderId());
		newName.value = '';
	});
}

async function addDocument() {
	const name = newName.value.trim();
	if (!name) {
		return;
	}
	try {
		const doc = await createDocument(name, currentFolderId());
		router.push({ name: 'document', params: { id: doc.id } });
	} catch (e) {
		error.value = e.message;
	}
}

function onUpload(event) {
	const file = event.target.files[0];
	event.target.value = '';
	if (file) {
		run(() => uploadFile(file, currentFolderId()));
	}
}

function removeFolder(folder) {
	if (confirm(`Brûler le dossier « ${folder.name} » et tout son contenu ?`)) {
		run(() => deleteFolder(folder.id));
	}
}

function removeDocument(doc) {
	if (confirm(`Brûler « ${doc.name} » ?`)) {
		run(() => deleteDocument(doc.id));
	}
}
</script>

<template>
	<section class="page">
		<nav class="breadcrumb">
			<RouterLink :to="{ name: 'library' }">Bibliothèque</RouterLink>
			<template v-for="folder in library?.path" :key="folder.id">
				<span>›</span>
				<RouterLink :to="{ name: 'library', params: { folderId: folder.id } }">{{ folder.name }}</RouterLink>
			</template>
		</nav>

		<h1>{{ library?.folder ? library.folder.name : 'Bibliothèque' }}</h1>

		<div class="toolbar">
			<input v-model="newName" placeholder="Nom du dossier ou du parchemin" />
			<button class="btn btn-ghost" @click="addFolder">Créer un dossier</button>
			<button class="btn btn-ghost" @click="addDocument">Écrire un parchemin</button>
			<label class="btn">
				Déposer un fichier
				<input type="file" hidden @change="onUpload" />
			</label>
		</div>

		<p v-if="error" class="error">{{ error }}</p>

		<table v-if="library" class="parchment">
			<thead>
				<tr>
					<th>Nom</th>
					<th>Type</th>
					<th>Dernière modification</th>
					<th>Par</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="folder in library.folders" :key="'folder-' + folder.id" class="folder-row">
					<td>
						<RouterLink :to="{ name: 'library', params: { folderId: folder.id } }">{{ folder.name }}</RouterLink>
					</td>
					<td><span class="badge badge-folder" title="Contient d'autres parchemins et fichiers">Dossier</span></td>
					<td>{{ formatDate(folder.updated_at) }}</td>
					<td></td>
					<td><button class="link-danger" @click="removeFolder(folder)">Brûler</button></td>
				</tr>
				<tr v-for="doc in library.documents" :key="'doc-' + doc.id">
					<td>
						<RouterLink :to="{ name: 'document', params: { id: doc.id } }">{{ doc.name }}</RouterLink>
					</td>
					<td>
						<span v-if="doc.file_path" class="badge badge-file" title="Fichier importé, remplaçable">Fichier</span>
						<span v-else class="badge badge-parchment" title="Texte modifiable à plusieurs">Parchemin</span>
					</td>
					<td>{{ formatDate(doc.updated_at) }}</td>
					<td>{{ doc.updated_by_name }}</td>
					<td><button class="link-danger" @click="removeDocument(doc)">Brûler</button></td>
				</tr>
				<tr v-if="!library.folders.length && !library.documents.length">
					<td colspan="5" class="empty">Les étagères sont vides.</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>
