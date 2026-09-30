const host = window.location.hostname;

export const API_URL = import.meta.env.VITE_API_URL || `http://${host}:3000`;
export const WS_URL = import.meta.env.VITE_WS_URL || `ws://${host}:3001`;

// Tant que le back n'est pas prêt, on travaille sur les données de src/mocks
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
