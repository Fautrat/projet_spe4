# Projet Spé 4

Application collaborative d'édition de documents en temps réel.

## Structure

- `back/` : API REST (Node.js, Express)
- `websocket/` : serveur temps réel (Node.js, ws)
- `front/` : client web (Vue 3, Vite)

## Prérequis

Node.js 20.19 ou supérieur.

## Base de données

MySQL 8.4 tourne dans Docker. À la racine du projet :

```bash
docker compose up -d
```

- Au premier démarrage, le conteneur crée les tables à partir de `database/init/tables.sql`.
- Les identifiants sont dans le `.env` de la racine. `back/.env` doit reprendre les mêmes `DB_DATABASE`, `DB_USER` et `DB_PASSWORD`.
- Port 3306 déjà pris : changer `DB_PORT` dans le `.env` de la racine et dans `back/.env`, par exemple `3307`.
- Consulter la base : `docker exec -it spe4-mysql mysql -u <DB_USER> -p`, ou un logiciel comme MySQL Workbench ou DBeaver sur `localhost` et le port `DB_PORT`.
- Arrêter : `docker compose down`. Les données sont conservées.
- Repartir d'une base vide et rejouer le script SQL : `docker compose down -v`, puis `docker compose up -d`.

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
| Admin (maître du jeu) | mj@test.fr | admin1234 |
| Utilisateur (aventurier) | aventurier@test.fr | user1234 |

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
