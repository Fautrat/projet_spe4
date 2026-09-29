import * as Y from 'yjs';

const textarea = document.getElementById('editor');
const cursorsDiv = document.getElementById('cursors');

const colors = ['red', 'green', 'blue', '#orange', '#violet', '#purple', '#pink', '#brown'];
const myName = "Username" + Math.floor(Math.random() * 1000); // Get the username
const myColor = colors[Math.floor(Math.random() * colors.length)];

let socket = null;
let doc = null;
let text = null;
let cursors = {}; // id -> { name, color, position }

export function openDocument(ws, state) {
    socket = ws;
    doc = new Y.Doc();
    text = doc.getText('content');
    Y.applyUpdate(doc, fromBase64(state));

    // on envoie nos modifs aux autres (pas celles qu'on a reçues)
    doc.on('update', (update, origin) => {
        if (origin !== 'remote') {
            socket.send(JSON.stringify({ type: 'update', update: toBase64(update) }));
        }
    });

    cursors = {};
    textarea.value = text.toString();
    textarea.disabled = false;
    showCursors();
}

export function receiveUpdate(update) {
    // on garde notre curseur au bon endroit
    const start = Y.createRelativePositionFromTypeIndex(text, textarea.selectionStart);
    const end = Y.createRelativePositionFromTypeIndex(text, textarea.selectionEnd);

    Y.applyUpdate(doc, fromBase64(update), 'remote');

    textarea.value = text.toString();
    textarea.setSelectionRange(toIndex(start), toIndex(end));
    showCursors();
}

export function receiveCursor(message) {
    cursors[message.from] = message;
    showCursors();
}

export function removeCursor(id) {
    delete cursors[id];
    showCursors();
}

export function sendCursor() {
    if (!doc) return;
    const position = Y.createRelativePositionFromTypeIndex(text, textarea.selectionStart);
    socket.send(JSON.stringify({
        type: 'cursor',
        name: myName,
        color: myColor,
        position: Y.relativePositionToJSON(position),
    }));
}

// on cherche ce qui a changé entre l'ancien et le nouveau texte
textarea.addEventListener('input', () => {
    const before = text.toString();
    const after = textarea.value;

    let start = 0;
    while (start < before.length && before[start] === after[start]) start++;

    let end = 0;
    while (
        end < before.length - start &&
        end < after.length - start &&
        before[before.length - 1 - end] === after[after.length - 1 - end]
    ) end++;

    doc.transact(() => {
        text.delete(start, before.length - start - end);
        text.insert(start, after.slice(start, after.length - end));
    });

    showCursors();
});

textarea.addEventListener('input', sendCursor);
textarea.addEventListener('keyup', sendCursor);
textarea.addEventListener('click', sendCursor);
textarea.addEventListener('focus', sendCursor);

textarea.addEventListener('scroll', () => {
    cursorsDiv.scrollTop = textarea.scrollTop;
});

// les curseurs sont dans une div derrière le textarea, avec le même texte en transparent
function showCursors() {
    cursorsDiv.textContent = '';
    if (!doc) return;

    const list = Object.values(cursors)
        .map((cursor) => ({ ...cursor, index: toIndex(Y.createRelativePositionFromJSON(cursor.position)) }))
        .filter((cursor) => cursor.index !== null)
        .sort((a, b) => a.index - b.index);

    const content = text.toString();
    let last = 0;

    for (const cursor of list) {
        cursorsDiv.append(content.slice(last, cursor.index));

        const bar = document.createElement('span');
        bar.className = 'cursor';
        bar.style.borderColor = cursor.color;

        const name = document.createElement('span');
        name.className = 'cursor-name';
        name.style.background = cursor.color;
        name.textContent = cursor.name;

        bar.append(name);
        cursorsDiv.append(bar);
        last = cursor.index;
    }

    cursorsDiv.append(content.slice(last) + '\n');
    cursorsDiv.scrollTop = textarea.scrollTop;
}

function toIndex(relativePosition) {
    const position = Y.createAbsolutePositionFromRelativePosition(relativePosition, doc);
    return position ? position.index : null;
}

// Update YJS en base64
function toBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function fromBase64(base64) {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
