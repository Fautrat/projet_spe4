## Back

### Les routes à implémenter

| # | Méthode | Route | Accès |
|---|---|---|---|
| 1 | POST | `/api/auth/register` | public |
| 2 | POST | `/api/auth/login` | public |
| 3 | POST | `/api/auth/2fa/verify` | public |
| 4 | POST | `/api/auth/logout` | connecté |
| 5 | PATCH | `/api/users/me` | connecté |
| 6 | PATCH | `/api/users/me/password` | connecté |
| 7 | POST | `/api/auth/2fa/setup` | connecté |
| 8 | POST | `/api/auth/2fa/enable` | connecté |
| 9 | POST | `/api/auth/2fa/disable` | connecté |
| 10 | GET | `/api/folders/root` | connecté |
| 11 | GET | `/api/folders/:id` | connecté |
| 12 | POST | `/api/folders` | connecté |
| 13 | DELETE | `/api/folders/:id` | connecté |
| 14 | POST | `/api/documents` | connecté |
| 15 | POST | `/api/documents/upload` | connecté |
| 16 | GET | `/api/documents/:id` | connecté |
| 17 | PATCH | `/api/documents/:id` | connecté |
| 18 | PUT | `/api/documents/:id/file` | connecté |
| 19 | DELETE | `/api/documents/:id` | connecté |
| 20 | GET | `/api/documents/:id/file` | connecté |
| 21 | GET | `/api/users` | admin |
| 22 | POST | `/api/users` | admin |
| 23 | PATCH | `/api/users/:id` | admin |

## Front

- inviter collaborateurs
- appel audio/vidéo avec d'autres
- messagerie instantannée quand plusieurs personnes sur meme parchemin ? 

## Websocket

- presque tout déjà fait 