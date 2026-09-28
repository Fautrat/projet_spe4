import { createPool } from 'mysql2';

export const conn = createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

export const getUserRole = async (email) => {
    const role = new Promise((resolve, reject) => {
        conn.query(
            `SELECT role FROM users WHERE email = ?;`,
            [email],
            (err, results) => {
                if(err){reject(err);}
                else{resolve(results[0].role);};
            }
        );
    });
    return role;
};