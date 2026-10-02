<script setup>
import { nextTick, ref, watch } from 'vue';
import { session } from '../stores/session.js';
import { formatDate } from '../utils/format.js';

const props = defineProps({
	messages: { type: Array, required: true },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['send']);

const open = ref(false);
const unread = ref(0);
const text = ref('');
const list = ref(null);

function scrollDown() {
	nextTick(() => {
		if (list.value) list.value.scrollTop = list.value.scrollHeight;
	});
}

function toggle() {
	open.value = !open.value;
	if (open.value) {
		unread.value = 0;
		scrollDown();
	}
}

watch([() => props.messages, () => props.messages.length], ([messages, length], [oldMessages, oldLength]) => {
	if (open.value) {
		scrollDown();
		return;
	}
	const last = messages[length - 1];
	if (messages === oldMessages && length > oldLength && last.user_id !== session.user.id) {
		unread.value++;
	}
});

function isMine(message) {
	return message.user_id === session.user.id;
}

// Le nom n'est affiché qu'au premier message d'une suite envoyée par la même personne
function showName(index) {
	const message = props.messages[index];
	return !isMine(message) && (index === 0 || props.messages[index - 1].user_id !== message.user_id);
}

function send() {
	const content = text.value.trim();
	if (!content || props.disabled) return;
	emit('send', content);
	text.value = '';
}
</script>

<template>
	<div class="chat">
		<section v-if="open" class="chat-window" aria-label="Messagerie du document">
			<header>
				<strong>Messagerie</strong>
				<button class="chat-close" aria-label="Fermer la messagerie" @click="toggle">×</button>
			</header>

			<div ref="list" class="chat-messages">
				<p v-if="!messages.length" class="chat-empty">Aucun message pour l'instant.</p>
				<div v-for="(message, index) in messages" :key="message.id" class="chat-row" :class="{ mine: isMine(message) }">
					<small v-if="showName(index)" class="chat-name">{{ message.first_name }} {{ message.last_name }}</small>
					<p class="chat-bubble" :title="formatDate(message.created_at)">{{ message.content }}</p>
				</div>
			</div>

			<form class="chat-form" @submit.prevent="send">
				<input
					v-model="text"
					maxlength="2000"
					:placeholder="disabled ? 'Connexion perdue…' : 'Écrire un message…'"
					aria-label="Message"
					:disabled="disabled"
				/>
				<button class="btn" :disabled="disabled || !text.trim()">Envoyer</button>
			</form>
		</section>

		<button class="chat-toggle" :aria-label="open ? 'Fermer la messagerie' : 'Ouvrir la messagerie'" :aria-expanded="open" @click="toggle">
			<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
				<path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
			</svg>
			<span v-if="unread" class="chat-badge">{{ unread }}</span>
		</button>
	</div>
</template>

<style scoped>
.chat {
	position: fixed;
	right: 1.5rem;
	bottom: 1.5rem;
	z-index: 50;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.8rem;
}

/* bouton rond accroché en bas à droite */
.chat-toggle {
	position: relative;
	display: grid;
	place-items: center;
	width: 3.6rem;
	height: 3.6rem;
	background: radial-gradient(circle at 35% 30%, #b13a3a, var(--blood-dark));
	border: 2px solid var(--gold);
	border-radius: 50%;
	color: var(--parchment);
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
	cursor: pointer;
}

.chat-badge {
	position: absolute;
	top: -0.3rem;
	right: -0.3rem;
	min-width: 1.4rem;
	padding: 0.1rem 0.35rem;
	background: var(--gold);
	border-radius: 999px;
	color: var(--leather);
	font-size: 0.8rem;
	font-weight: 700;
}

.chat-window {
	display: flex;
	flex-direction: column;
	width: min(340px, calc(100vw - 3rem));
	height: min(460px, calc(100vh - 8rem));
	overflow: hidden;
	background: var(--parchment);
	border-radius: 10px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
	color: var(--ink);
}

.chat-window header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.7rem 1rem;
	background: var(--leather);
	color: var(--gold);
	font-family: var(--title);
}

.chat-close {
	background: none;
	border: none;
	color: var(--gold);
	font-size: 1.5rem;
	line-height: 1;
	cursor: pointer;
}

.chat-messages {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.35rem;
	padding: 0.9rem;
	overflow-y: auto;
}

.chat-empty {
	margin: auto;
	color: var(--ink-light);
	font-style: italic;
}

.chat-row {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.chat-row.mine {
	align-items: flex-end;
}

.chat-name {
	margin: 0.4rem 0 0.1rem 0.6rem;
	color: var(--ink-light);
	font-size: 0.8rem;
}

.chat-bubble {
	max-width: 80%;
	margin: 0;
	padding: 0.45rem 0.8rem;
	background: #fbf4e2;
	border: 1px solid rgba(107, 86, 64, 0.35);
	border-radius: 16px 16px 16px 4px;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.mine .chat-bubble {
	background: var(--blood);
	border-color: var(--blood-dark);
	border-radius: 16px 16px 4px 16px;
	color: var(--parchment);
}

.chat-form {
	display: flex;
	gap: 0.5rem;
	padding: 0.7rem;
	border-top: 1px solid rgba(107, 86, 64, 0.35);
}

.chat-form input {
	flex: 1;
	min-width: 0;
}
</style>
