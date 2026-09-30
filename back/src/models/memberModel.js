import { db } from '../config/db.js';

// Personnes invitées sur un document
export async function findMembers(documentId) {
	const [rows] = await db.query(
		`SELECT u.id, u.email, u.first_name, u.last_name, m.invited_by, m.created_at AS invited_at
		FROM document_members m JOIN users u ON u.id = m.user_id
		WHERE m.document_id = ?
		ORDER BY u.first_name, u.last_name`,
		[documentId],
	);
	return rows;
}

// Comptes actifs qu'on peut encore inviter, sans le créateur ni les personnes déjà invitées
export async function findInvitable(documentId, ownerId) {
	const [rows] = await db.query(
		`SELECT id, email, first_name, last_name FROM users
		WHERE is_blocked = FALSE AND id <> ?
			AND id NOT IN (SELECT user_id FROM document_members WHERE document_id = ?)
		ORDER BY first_name, last_name`,
		[ownerId, documentId],
	);
	return rows;
}

export async function findActiveUserByEmail(email) {
	const [rows] = await db.query(
		'SELECT id, email, first_name, last_name FROM users WHERE email = ? AND is_blocked = FALSE',
		[email],
	);
	return rows[0] || null;
}

export async function isMember(documentId, userId) {
	const [rows] = await db.query(
		'SELECT 1 FROM document_members WHERE document_id = ? AND user_id = ?',
		[documentId, userId],
	);
	return rows.length > 0;
}

export async function add(documentId, userId, invitedBy) {
	await db.query(
		'INSERT INTO document_members (document_id, user_id, invited_by) VALUES (?, ?, ?)',
		[documentId, userId, invitedBy],
	);
}

export async function remove(documentId, userId) {
	const [result] = await db.query(
		'DELETE FROM document_members WHERE document_id = ? AND user_id = ?',
		[documentId, userId],
	);
	return result.affectedRows > 0;
}
