import { db } from '../config/db.js';

export async function findAll() {
	const [rows] = await db.query(
		`SELECT id, email, first_name, last_name, role, is_blocked, totp_enabled, created_at
		FROM users
		ORDER BY created_at`,
	);
	return rows;
}

export async function findById(id) {
	const [rows] = await db.query(
		`SELECT id, email, first_name, last_name, role, is_blocked, totp_enabled, created_at
		FROM users
		WHERE id = ?`,
		[id],
	);
	return rows[0] || null;
}

export async function emailExists(email) {
	const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
	return rows.length > 0;
}

export async function create({ firstName, lastName, email, passwordHash }) {
	const [result] = await db.query(
		'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
		[firstName, lastName, email, passwordHash],
	);
	return findById(result.insertId);
}

export async function setRole(id, role) {
	const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
	return result.affectedRows ? findById(id) : null;
}

export async function setBlocked(id, isBlocked) {
	const [result] = await db.query('UPDATE users SET is_blocked = ? WHERE id = ?', [isBlocked, id]);
	return result.affectedRows ? findById(id) : null;
}
