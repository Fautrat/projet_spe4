# Projet Spé 4

Application collaborative d'édition de documents en temps réel.

## Structure

- `back/` : API REST (Node.js, Express)
- `websocket/` : serveur temps réel (Node.js, ws)
- `front/` : client web (Vue 3, Vite)

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

## Comptes de test du front

Tant que `VITE_USE_MOCKS` ne vaut pas `false` dans `front/.env`, le front tourne sur des données simulées (`front/src/mocks/mockBackApi.js`) :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin (maître du jeu) | mj@grimoire.fr | admin1234 |
| Utilisateur (aventurier) | aventurier@grimoire.fr | user1234 |

## Convention de commit

Les messages de commit suivent les [Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/) :

```
<type>(<scope optionnel>): <description>
```

Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`.

Le hook `.githooks/commit-msg` refuse tout commit non conforme. `npm install` dans n'importe quel dossier (`back`, `websocket` ou `front`) l'active automatiquement. Pour l'activer sans installer les dépendances :

```bash
git config core.hooksPath .githooks
```
