# TODO

## Base de données

- [x] Docker Compose MySQL
- [x] Création des tables au premier démarrage
- [x] Connexion du back à MySQL
- [x] Comptes de test (`database/init/users-test.sql`)

## Back

- [x] Hachage des mots de passe (bcrypt) et token JWT
- [x] Middlewares : `auth.js` (token, compte relu en base, `connected`, `admin`, `loginLimit`), `upload.js`, `errors.js`
- [x] Upload des fichiers (multer), suppression sur le disque avec le document ou le dossier
- [x] Visibilité : on ne voit que ses documents et dossiers et ceux où on est invité (admins compris)
- [ ] 2FA à la connexion : renvoyer `{ requires_2fa: true, temp_token }` si la 2FA est active
- [x] Limiter les tentatives de connexion (express-rate-limit) : 5 échecs par tranche de 15 min pour le couple IP et email
- [ ] Mettre aussi `loginLimit` sur `POST /api/auth/2fa/verify` quand la route existera

### Routes attendues par le front

Règles communes : JSON, noms des colonnes de la base, token dans `Authorization: Bearer <token>`, erreurs en `{ message }` en français, jamais de `password_hash` ni de `totp_secret` dans une réponse.

`user` = `{ id, email, first_name, last_name, role, is_blocked, totp_enabled }`
`document` = `{ id, folder_id, name, content, file_path, mime_type, file_size, updated_at, updated_by_name }`
`dossier` = `{ id, name, parent_id, updated_at }`

Authentification

- [x] `POST /api/auth/register` (public) : `{ first_name, last_name, email, password }` :`{ user, token }`, rôle toujours `user`
- [x] `POST /api/auth/login` (public) : `{ email, password }` :`{ user, token }`
- [ ] `POST /api/auth/2fa/verify` (public) : `{ temp_token, code }` :`{ user, token }`
- [x] Déconnexion côté front (le token JWT est simplement oublié)

Profil (`profileController.js`, requêtes dans `userModel.js`, branché côté front sauf la 2FA)

- [x] `PATCH /api/users/me` (connecté) : `{ first_name, last_name, email }` → `user`
- [x] `PATCH /api/users/me/password` (connecté) : `{ current_password, new_password }`, ancien mot de passe vérifié, 8 caractères minimum
- [ ] `POST /api/auth/2fa/setup` (connecté) → `{ secret, qr_code }`, QR code en data URL
- [ ] `POST /api/auth/2fa/enable` (connecté) : `{ code }` → `user`
- [ ] `POST /api/auth/2fa/disable` (connecté) : `{ code }` → `user`

Dossiers

- [x] `GET /api/folders/root` et `GET /api/folders/:id` (connecté) :`{ folder, path, folders, documents }`
- [x] `POST /api/folders` (connecté, dans ses propres dossiers) : `{ name, parent_id }` :`dossier`
- [x] `DELETE /api/folders/:id` (créateur)

Documents

- [x] `POST /api/documents` (connecté, dans ses propres dossiers) : `{ name, folder_id }` :`document`
- [x] `POST /api/documents/upload` (connecté) : formulaire `file`, `folder_id` :`document`
- [x] `GET /api/documents/:id` (créateur ou invité) : `document`
- [x] `PATCH /api/documents/:id` (créateur ou invité) : `{ content }` :`document`
- [x] `PUT /api/documents/:id/file` (créateur ou invité) : formulaire `file` :`document`
- [x] `DELETE /api/documents/:id` (créateur)
- [x] `GET /api/documents/:id/file` (créateur ou invité) : fichier brut, chargé par le front avec le token

Administration

- [x] `GET /api/admin/users` (admin) :liste de `user`
- [x] `POST /api/admin/users` (admin) : `{ first_name, last_name, email, password }` :`user`, rôle toujours `user`
- [x] `PATCH /api/admin/users/:id` (admin) : `{ is_blocked }` :`user`
- [x] `PATCH /api/admin/users/:id/role` (admin) : `{ role }` : `user` (adouber, destituer)

Invitations

- [x] `GET /api/documents/:id/members` (créateur ou invité) :personnes invitées
- [x] `GET /api/documents/:id/invitable` (créateur) : comptes actifs qu'on peut inviter
- [x] `POST /api/documents/:id/members` (créateur) : `{ email }` :personne invitée
- [x] `DELETE /api/documents/:id/members/:userId` (créateur ou la personne elle-même)

## Front

- [x] Connexion, inscription, bibliothèque, éditeur, administration branchés sur le vrai back
- [x] Inviter une personne sur un document (`DocumentMembers.vue`)
- [X] Édition à plusieurs en temps réel
- [X] Sauvegarde par l'API si le websocket tombe
- [x] Reconnexion automatique du websocket, le texte écrit pendant la coupure est renvoyé au retour
- [x] Brancher la modification du profil et du mot de passe
- [ ] Brancher la 2FA quand ses routes existeront, puis supprimer les mocks
- [x] Appel audio avec une personne invitée
- [x] curseur
- [x] Messagerie instantanée par document (`ChatBox.vue`, table `documents_messages`, enregistrée par le websocket)
- [ ] Bonus : appel vidéo

## Websocket

- [x] Salons par document
- [x] Vérifier le token (passé dans l'URL du websocket) et l'accès au document (`canAccess` dans `documents.js`)
- [x] Liste des présents dans le salon
- [x] Présents regroupés par compte, curseurs de ses autres onglets masqués
- [ ] Relais des messages d'appel (WebRTC) vers un destinataire précis
