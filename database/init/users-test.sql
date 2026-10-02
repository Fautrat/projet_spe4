-- Comptes de test, exécutés après tables.sql

INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
	(1, 'mj@test.fr', '$2b$10$AM1oHbDWOAAsQlFj.OjhX.Bf8TfQRgXxWlhj8Z4tI1H7EffoF0UjC', 'Maitre', 'Jedi', 'admin'),
	(2, 'aventurier@test.fr', '$2b$10$tLSFG8LlY8G6OBVB9fDjluAb1HG1TYyPGqvyGsMIyvEYo2x/IpChG', 'Jeune', 'Padawan', 'user');
