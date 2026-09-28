# Projet Spé 4

Application collaborative d'édition de documents en temps réel.

## Structure

- `back/` : API REST (Node.js, Express)
- `websocket/` : serveur temps réel (Node.js, ws)
- `front/` : client web (Vite)

## Prérequis

Node.js 20.19 ou supérieur.

## Lancement

Dans trois terminaux séparés :

```bash
cd back
cp .env.example .env
npm install
npm run dev
```

```bash
cd websocket
cp .env.example .env
npm install
npm run dev
```

```bash
cd front
cp .env.example .env
npm install
npm run dev
```

| Service   | URL par défaut        |
|-----------|-----------------------|
| API       | http://localhost:3000 |
| WebSocket | ws://localhost:3001   |
| Front     | http://localhost:5173 |
