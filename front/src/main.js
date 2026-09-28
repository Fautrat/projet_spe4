const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

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

const socket = new WebSocket(WS_URL);

socket.addEventListener('open', () => {
    wsStatus.textContent = 'connecté';
});

socket.addEventListener('close', () => {
    wsStatus.textContent = 'déconnecté';
});
