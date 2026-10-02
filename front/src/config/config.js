const host = window.location.hostname;

export const API_URL = import.meta.env.VITE_API_URL || `http://${host}:3000`;
export const WS_URL = import.meta.env.VITE_WS_URL || `ws://${host}:3001`;
