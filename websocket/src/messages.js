import { db } from './db.js';

// Les 50 derniers messages du document, du plus ancien au plus récent
export async function getMessages(documentId) {
	const [rows] = await db.query(
		`SELECT documents_messages.id, documents_messages.user_id, users.first_name, users.last_name, documents_messages.content, documents_messages.created_at
		FROM documents_messages
		JOIN users ON users.id = documents_messages.user_id
		WHERE documents_messages.document_id = ?
		ORDER BY documents_messages.id DESC
		LIMIT 50`,
		[documentId],
	);
	return rows.reverse();
}

// Enregistre le message et le renvoie avec le nom de son auteur
export async function addMessage(documentId, userId, content) {
	const [result] = await db.query(
		'INSERT INTO documents_messages (document_id, user_id, content) VALUES (?, ?, ?)',
		[documentId, userId, content],
	);
	const [rows] = await db.query(
		`SELECT documents_messages.id, documents_messages.user_id, users.first_name, users.last_name, documents_messages.content, documents_messages.created_at
		FROM documents_messages
		JOIN users ON users.id = documents_messages.user_id
		WHERE documents_messages.id = ?`,
		[result.insertId],
	);
	return rows[0];
}
