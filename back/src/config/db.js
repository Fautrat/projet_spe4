import { createPool } from 'mysql2';

// Pool de connexions MySQL, configuré par les variables DB_* du .env.
export const conn = createPool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT) || 3306,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	charset: 'utf8mb4',
	connectionLimit: 10,
});

export const db = conn.promise();

export async function checkDatabaseConnection() {
	await db.query('SELECT 1');
}

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
