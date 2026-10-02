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

Nous avons pris Vite pour lancer et compiler le front rapidement et facilement. Le serveur de développement démarre vite et la page se met à jour dès qu'on enregistre un fichier. Pour le rendu, `npm run build` compile notre application Vue en simples fichiers HTML, CSS et JavaScript, que le back sert directement. Grâce à ça, nous n'avons que deux serveurs à lancer : le back, qui sert aussi le front, et le serveur websocket.

#### Vue

On n'est pas fan de React que l'on trouve plus compliqué que Vue. Vue nous a paru plus facile à utiliser, avec des templates qui ressemblent à du HTML classique et c'était déjà ce que l'on avait utilisé dans notre premier rendu JDR lors du cours dev web Vue.

#### Vue Router

L'application a plusieurs pages (connexion, bibliothèque, document, profil, administration), chacune avec sa propre adresse. Vue Router nous permet de passer de l'une à l'autre sans recharger la page, de renvoyer vers la connexion quand on n'est pas connecté et de réserver facilement la page d'administration aux admins.

### Le websocket
Le serveur WebSocket gère le temps réel : l'édition à plusieurs, les curseurs,
la liste des présents et la mise en relation pour l'appel audio et la messagerie instantanée. Voici nos choix et pourquoi on les a faits.


#### 1. Un serveur séparé de l'API
-----------------------------

On aurait pu le mettre dans le même serveur Express. On l'a séparé parce que
l'API répond et oublie, alors que le WebSocket garde des connexions ouvertes et
des données en mémoire : les mélanger aurait rendu le code confus. En plus, si
l'un plante, l'autre continue de tourner.

Les deux partagent juste la base MySQL et le secret JWT, pas besoin qu'ils se
parlent directement


#### 2. ws plutôt que Socket.IO
--------------------------

Socket.IO fait déjà les salons, mais il est plus lourd et utilise son propre
protocole, donc il faut sa librairie aussi côté navigateur. Avec ws, on utilise
le WebSocket natif du navigateur. Et les salons se codent en quelques lignes

Les messages sont en JSON avec un champ "type" : facile à lire pour debug,
et on peut ajouter un type sans casser les autres.


#### 3. Le token dans l'URL
----------------------

Le WebSocket du navigateur ne permet pas d'ajouter un en-tête Authorization,
donc on passe le token dans l'URL. On réutilise le même token que l'API : le
serveur le vérifie seul avec le secret, et l'utilisateur ne se connecte qu'une
fois. Un token invalide ferme la connexion tout de suite.


#### 4. Vérifier l'accès au document côté back
--------------------------------------------

À chaque "join", on vérifie en base que la personne est créatrice du document
ou invitée.

Pour la même raison, c'est le serveur qui indique qui a envoyé un message, pas
le client : personne ne peut se faire passer pour un autre.


#### 5. Un salon par document
------------------------

Les salons sont dans une Map (id du document -> Set de connexions). La Map
retrouve un salon directement par son id, le Set évite les doublons. Comme ça,
un message ne part qu'aux personnes du même document.

Quand un salon est vide, on le supprime pour ne pas saturer le serveur de
rooms vides.

On renvoie toute la liste des présents à chaque arrivée ou départ, plutôt que
juste "un tel est parti" : si un client rate un message, sa liste se corrige
toute seule au suivant.


#### 6. Le texte en mémoire, sauvegardé toutes les 10 secondes
---------------------------------------------------------

Écrire en base à chaque touche ferait plusieurs requêtes par seconde. On garde
donc le texte en mémoire : c'est instantané, et si quelqu'un arrive il reçoit la
 dernière version.

On sauvegarde toutes les 10 secondes, 1,5 secondes après avoir arreter de taper et
quand la dernière personne quitte le document. On a estimé que 10 secondes, c'est le compromis
entre ne pas perdre grand-chose si le serveur tombe et ne pas surcharger la
base.


#### 7. WebRTC pour l'appel
----------------------

Le son passe directement d'un navigateur à l'autre. 
Les navigateurs doivent quand même échanger quelques infos pour se trouver. On
utilise le WebSocket pour ça uniquement pour initialisé ou terminer les appels.