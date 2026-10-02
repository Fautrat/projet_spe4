# Projet Spé 4

Application collaborative d'édition de documents en temps réel.

## Structure

- `back/` : API REST (Node.js, Express)
- `websocket/` : serveur temps réel (Node.js, ws)
- `front/` : client web (Vue 3, Vite)

## Prérequis

Node.js 20.19 ou plus récent dans la branche 20, ou 22.12 et plus (exigé par Vite 7).

## Base de données

MySQL 8.4 tourne dans Docker, avec le `docker-compose.yml` du dossier `back` :

```bash
cd back
docker compose up -d
```

- Au premier démarrage, le conteneur crée les tables à partir de `database/init/tables.sql`.
- Les identifiants viennent de `back/.env` (`DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`), lu à la fois par Docker Compose et par l'API. `websocket/.env` doit reprendre les mêmes valeurs.
- Port 3306 déjà pris : changer `DB_PORT` dans `back/.env` et `websocket/.env`.
- Consulter la base : `docker exec -it spe4-mysql mysql -u <DB_USER> -p`, ou un logiciel comme MySQL Workbench ou DBeaver sur `localhost` et le port `DB_PORT`.
- Arrêter : `docker compose down` (toujours depuis `back`). Les données sont conservées.
- Repartir d'une base vide et rejouer le script SQL : `docker compose down -v`, puis `docker compose up -d`.

## Lancement

Le front est compilé une fois, puis servi par le back : il n'y a que deux serveurs à lancer, le back et le websocket. La base de donnée doit être démarrée avant (voir plus haut).

1. Créer les fichiers `.env` à partir des exemples. `JWT_SECRET` doit avoir la même valeur dans `back/.env` et `websocket/.env`, sinon le websocket refuse les connexions.

```bash
cp back/.env.example back/.env
cp websocket/.env.example websocket/.env
cp front/.env.example front/.env
```

2. Compiler le front. Le résultat est écrit dans `front/dist`.

```bash
cd front
npm install
npm run build
```

3. Lancer le back, qui sert aussi le front compilé :

```bash
cd back
npm install
npm start
```

4. Dans un autre terminal, lancer le websocket :

```bash
cd websocket
npm install
npm start
```

5. Ouvrir http://localhost:3000.

Le back ne regarde `front/dist` qu'au démarrage : s'il a été lancé avant la compilation, il faut le redémarrer. Après une modification du front, il suffit de relancer `npm run build` puis de recharger la page.

| Service | URL par défaut |
|---|---|
| Web client et API | http://localhost:3000 |
| WebSocket | ws://localhost:3001 |

## Comptes de test

Créés au premier démarrage de la base par `database/init/users-test.sql` :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin (maître du jeu) | mj@test.fr | admin1234 |
| Utilisateur (aventurier) | aventurier@test.fr | user1234 |

