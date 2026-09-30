import { conn } from '../config/db.js';

export const getUserRole = async (email) => {
	const role = new Promise((resolve, reject) => {
		conn.query(
			`SELECT role FROM users WHERE email = ?;`,
			[email],
			(err, results) => {
				if (err) {
					reject(err);
				} else {
					resolve(results[0].role);
				}
			}
		);
	});
	return role;
};