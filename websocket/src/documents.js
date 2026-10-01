import { db } from './db.js';

// documents en cours d'édition : id -> { text, changed, userId }
export const docs = new Map();

export async function getDoc(id) {
	if (!docs.has(id)) {
		const [rows] = await db.query('SELECT content FROM documents WHERE id = ?', [id]);
		if (rows.length === 0) return null;
		docs.set(id, { text: rows[0].content || '', changed: false, userId: null });
	}
	return docs.get(id);
}

// un compte supprimé ou bloqué n'a plus accès, même si son token est encore valide
export async function canAccess(id, userId) {
	const [rows] = await db.query(
		`SELECT 1 FROM documents d
		JOIN users u ON u.id = ? AND u.is_blocked = FALSE
		WHERE d.id = ? AND (d.created_by = ? OR EXISTS (
			SELECT 1 FROM document_members m WHERE m.document_id = d.id AND m.user_id = ?
		))`,
		[userId, id, userId, userId],
	);
	return rows.length > 0;
}

export async function saveDoc(id) {
	const doc = docs.get(id);
	if (!doc || !doc.changed) return false;

	await db.query('UPDATE documents SET content = ?, updated_by = COALESCE(?, updated_by) WHERE id = ?', [doc.text, doc.userId, id]);
	doc.changed = false;
	return true;
}
