import { openDocument, receiveUpdate, receiveCursor, removeCursor, sendCursor } from './editor.js';

const HOTE = window.location.hostname;
const API_URL = import.meta.env.VITE_API_URL || `http://${HOTE}:3000`;
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${HOTE}:3001`;
const apiStatus = document.getElementById('api-status');
const wsStatus = document.getElementById('ws-status');

fetch(`${API_URL}/api/health`)
    .then((response) => response.json())
    .then((data) => {
        apiStatus.textContent = data.status;
    })
    .catch(() => {
        apiStatus.textContent = 'hors ligne';
    });



///



const socket = new WebSocket(WS_URL);

socket.addEventListener('open', () => {
    wsStatus.textContent = 'connecté';
});

socket.addEventListener('close', () => {
    wsStatus.textContent = 'déconnecté';
});

const filesList = document.getElementById('files');
const roomStatus = document.getElementById('room-status');
const messages = document.getElementById('messages');

function showFiles(files) {
    filesList.textContent = '';
    for (const file of files) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = file;
        button.addEventListener('click', () => {
            socket.send(JSON.stringify({ type: 'join', room: file }));
        });
        li.append(button);
        filesList.append(li);
    }
}

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
        case 'files':
            showFiles(message.files);
            break;
        case 'joined':
            roomStatus.textContent = message.room;
            openDocument(socket, message.state);
            break;
        case 'update':
            receiveUpdate(message.update);
            break;
        case 'cursor':
            receiveCursor(message);
            break;
        case 'user-joined':
            sendCursor();
            break;
        case 'cursor-leave':
            removeCursor(message.from);
            break;
        default: {
            const li = document.createElement('li');
            li.textContent = `[${message.type}] ${message.error ?? ''}`;
            messages.append(li);
        }
    }
});
