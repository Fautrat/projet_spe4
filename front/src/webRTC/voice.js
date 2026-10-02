import { markRaw, reactive } from 'vue';


const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function createVoice(socket) {
	const myId = crypto.randomUUID();
	const peers = new Map(); // id cleint
	let localStream = null;

	const state = reactive({
		inCall: false,
		callers: {},
		streams: {},
		error: '',
	});

	function send(type, data = {}) {
		socket.sendJson({ type, sender: myId, ...data });
	}

	function createPeer(from, to, pending = []) {
		const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
		const peer = { pc, to, pending };
		peers.set(from, peer);

		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

		pc.ontrack = (event) => {
			state.streams[from] = markRaw(event.streams[0]);
		};
		pc.onicecandidate = (event) => {
			if (event.candidate) send('voice-ice', { to, candidate: event.candidate });
		};
		return peer;
	}

	function removePeer(from) {
		const peer = peers.get(from);
		if (peer) peer.pc.close();

		peers.delete(from);
		delete state.streams[from];
		delete state.callers[from];
	}

	async function addCandidate(peer, candidate) {
		try {
			await peer.pc.addIceCandidate(candidate);
		} catch {
			// candidat refusé par le navigateur : on l'ignore
		}
	}

	async function flushPending(peer) {
		for (const candidate of peer.pending) await addCandidate(peer, candidate);
		peer.pending = [];
	}

	async function start() {
		if (state.inCall) return;
		state.error = '';

		try {
			localStream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
				video: false,
			});
		} catch (err) {
			state.error = err.message;
			return;
		}

		state.inCall = true;
		send('voice-join');
	}

	function close() {
		for (const from of [...peers.keys()]) {
			peers.get(from).pc.close();
			peers.delete(from);
			delete state.streams[from];
		}

		if (localStream) localStream.getTracks().forEach((track) => track.stop());
		localStream = null;
		state.inCall = false;
	}

	function stop() {
		if (!state.inCall) return;
		send('voice-leave');
		close();
	}

	function reset() {
		close();
		for (const id in state.callers) delete state.callers[id];
	}

	async function onOffer(message) {
		if (!state.inCall) return;
		let pending = [];

		const old = peers.get(message.from);
		if (old) {
			if (myId < message.sender) return;
			pending = old.pending;
			old.pc.close();
		}

		const peer = createPeer(message.from, message.sender, pending);
		await peer.pc.setRemoteDescription(message.offer);
		await flushPending(peer);

		await peer.pc.setLocalDescription(await peer.pc.createAnswer());
		send('voice-answer', { to: peer.to, answer: peer.pc.localDescription });
	}

	async function onMessage(message) {
		// quelqu'un a fermé le document ou sa page
		if (message.type === 'cursor-leave') {
			removePeer(message.from);
			return false;
		}

		if (message.type === 'user-joined') {
			if (state.inCall) send('voice-ring');
			return false;
		}

		if (!message.type.startsWith('voice-')) return false;
		if (message.to && message.to !== myId) return true;

		const peer = peers.get(message.from);

		if (message.type === 'voice-join' || message.type === 'voice-ring') {
			// heure d'arrivée dans l'appel, affichée dans la liste des appels
			state.callers[message.from] = state.callers[message.from] || Date.now();

			if (message.type === 'voice-join' && state.inCall) {
				const created = createPeer(message.from, message.sender);
				await created.pc.setLocalDescription(await created.pc.createOffer());
				send('voice-offer', { to: created.to, offer: created.pc.localDescription });
			}
		} else if (message.type === 'voice-offer') {
			await onOffer(message);
		} else if (message.type === 'voice-answer') {
			if (peer && peer.pc.signalingState === 'have-local-offer') {
				await peer.pc.setRemoteDescription(message.answer);
				await flushPending(peer);
			}
		} else if (message.type === 'voice-ice') {
			if (peer && peer.pc.remoteDescription) await addCandidate(peer, message.candidate);
			else if (peer) peer.pending.push(message.candidate);
		} else if (message.type === 'voice-leave') {
			removePeer(message.from);
		}
		return true;
	}

	return { state, start, stop, reset, onMessage };
}
