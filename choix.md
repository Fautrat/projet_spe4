# Projet Spé 4 : nos choix

Toute l'application a un thème de jeu de rôle (JDR). Dans un précédent cours de développement web Vue, nous avions un sujet de gestion de JDR. Nous avons décidé de reprendre un peu le concept et de l'adapter à ce sujet, on trouvait ça marrant.

## Choix organisationnels

Nous avons découpé le projet en trois parties :

- le back (API REST et base de données) : Valentin et Enzo et Andrew ;
- le front (l'application Vue) : Sachiyo et Enzo et Andrew ;
- le serveur websocket (temps réel, appel audio, messagerie) : Sachiyo et Andrew.

Chaque partie a son propre dossier (`back`, `front`, `websocket`).

## Choix techniques et architecturaux

### Le back

Nous avons opté pour une API en vue de faciliter la répartition des tâches (cela nous permettait de développer chaque partie en parallèle pour tout rebrancher ensemble aisément au fur et à mesure). Cette API a été réalisée en JavaScript avec Express car c'est un framework simple, léger, et bien connu, ce qui permet de créer rapidement une API REST sans configuration excessive. Il correspond bien à nos besoins et est facile à prendre en main pour tout le groupe dans la mesure où il a été régulièrement abordé en cours.

### Le front

#### Vite

Nous avons pris Vite pour lancer et compiler le front. Le serveur de développement démarre vite et la page se met à jour dès qu'on enregistre un fichier. Pour le rendu, `npm run build` compile notre application Vue en simples fichiers HTML, CSS et JavaScript, que le back sert directement. Grâce à ça, nous n'avons que deux serveurs à lancer : le back, qui sert aussi le front, et le serveur websocket.

#### Vue

On n'est pas fan de React que l'on trouve plus compliqué que Vue. Vue nous a paru plus facile à utiliser, avec des templates qui ressemblent à du HTML classique.

#### Vue Router

L'application a plusieurs pages (connexion, bibliothèque, document, profil, administration), chacune avec sa propre adresse. Vue Router nous permet de passer de l'une à l'autre sans recharger la page, de renvoyer vers la connexion quand on n'est pas connecté et de réserver facilement la page d'administration aux admins.

### Le websocket
