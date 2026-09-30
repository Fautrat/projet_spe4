# TODO

## Base de données

- [x] Docker Compose MySQL
- [x] Création des tables au premier démarrage
- [x] Connexion du back à MySQL
- [ ] Script pour créer des comptes test 

## Back

- [ ] Hachage des mots de passe (bcrypt) et génération du token
- [ ] Middlewares : connecté, admin, compte non bloqué
- [ ] Upload des fichiers (multer), suppression sur le disque avec le document ou le dossier
- [ ] Vérifier l'accès à chaque document (propriétaire ou invité)
- [ ] Aligner les routes existantes (`/files`, `{ error }`) sur la liste ci-dessous

### Routes attendues par le front

Règles communes : préfixe `/api`, JSON, noms des colonnes de la base, token dans `Authorization: Bearer <token>`, erreurs en `{ message }` en français, jamais de `password_hash` ni de `totp_secret` dans une réponse.

`user` = `{ id, email, first_name, last_name, role, is_blocked, totp_enabled }`
`document` = `{ id, folder_id, name, content, file_path, mime_type, file_size, updated_at, updated_by_name }`
`dossier` = `{ id, name, parent_id, updated_at }`

Authentification

- [x] `POST /api/auth/register` (public) : `{ first_name, last_name, email, password }` → `{ user, token }`, rôle toujours `user`
- [x] `POST /api/auth/login` (public) : `{ email, password }` → `{ user, token }`, ou `{ requires_2fa: true, temp_token }` si 2FA active
- [ ] `POST /api/auth/2fa/verify` (public) : `{ temp_token, code }` → `{ user, token }`
- [ ] `POST /api/auth/logout` (connecté)

Profil

- [ ] `PATCH /api/users/me` (connecté) : `{ first_name, last_name, email }` → `user`
- [ ] `PATCH /api/users/me/password` (connecté) : `{ current_password, new_password }`
- [ ] `POST /api/auth/2fa/setup` (connecté) → `{ secret, qr_code }`, QR code en data URL
- [ ] `POST /api/auth/2fa/enable` (connecté) : `{ code }` → `user`
- [ ] `POST /api/auth/2fa/disable` (connecté) : `{ code }` → `user`

Dossiers

- [ ] `GET /api/folders/root` et `GET /api/folders/:id` (connecté) → `{ folder, path, folders, documents }`
- [ ] `POST /api/folders` (connecté) : `{ name, parent_id }` → `dossier`
- [ ] `DELETE /api/folders/:id` (connecté)

Documents

- [ ] `POST /api/documents` (connecté) : `{ name, folder_id }` → `document`
- [ ] `POST /api/documents/upload` (connecté) : formulaire `file`, `folder_id` → `document`
- [ ] `GET /api/documents/:id` (connecté) → `document`
- [ ] `PATCH /api/documents/:id` (connecté) : `{ content }` → `document`, appelé à chaque sauvegarde automatique
- [ ] `PUT /api/documents/:id/file` (connecté) : formulaire `file` → `document`
- [ ] `DELETE /api/documents/:id` (connecté)
- [ ] `GET /api/documents/:id/file` (connecté) → fichier brut, authentifié par cookie ou lien temporaire (les balises `<img>` et `<iframe>` n'envoient pas le token)

Administration

- [ ] `GET /api/users` (admin) → liste de `user`
- [ ] `POST /api/users` (admin) : `{ first_name, last_name, email, password, role }` → `user`
- [ ] `PATCH /api/users/:id` (admin) : `{ is_blocked }` → `user`

Invitations (pas encore utilisées par le front)

- [ ] Lister, inviter et retirer une personne d'un document (`document_members`)

Déclarer `/api/users/me` avant `/api/users/:id`, sinon Express prend `me` pour un id. `updated_by_name` s'obtient par jointure sur `users`.

## Front

- [x] Connexion, inscription, profil, bibliothèque, éditeur, administration (sur mocks)
- [ ] Brancher le vrai back (`VITE_USE_MOCKS=false`), puis supprimer les mocks
- [ ] Inviter une personne sur un document
- [X] Édition à plusieurs en temps réel
- [X] Reprise des modifications après une déconnexion
- [ ] Appel audio avec une personne invitée
- [ ] Bonus : appel à plusieurs, vidéo, curseurs des autres, messagerie instantanée

## Websocket

- [x] Salons par document
- [ ] Vérifier le token et l'accès au document à la connexion
- [ ] Liste des présents dans le salon
- [ ] Relais des messages d'appel (WebRTC) vers un destinataire précis
