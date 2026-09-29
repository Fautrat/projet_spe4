import { conn } from '../config/db.js';

const db = conn.promise();

// Get one file with the name of the last user who edited it
const findFile = async (id) => {
    const [files] = await db.query(
        `SELECT d.*, CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name
         FROM documents d JOIN users u ON u.id = d.updated_by
         WHERE d.id = ?;`,
        [id]
    );
    return files[0];
};

// Get all files
export const getFiles = async (req, res) => {
    try {
        const [files] = await db.query(
            `SELECT d.id, d.folder_id, d.name, d.file_path, d.updated_at, CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name
             FROM documents d JOIN users u ON u.id = d.updated_by
             ORDER BY d.updated_at DESC;`
        );
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Get one file
export const getFile = async (req, res) => {
    try {
        const file = await findFile(req.params.id);
        if (!file) {return res.status(404).json({ error: 'File not found' });}
        res.json(file);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Create one file
export const createFile = async (req, res) => {
    const { name, folder_id, created_by } = req.body;
    if (!name || !created_by) {return res.status(400).json({ error: 'name and created_by are required' });}

    try {
        const [result] = await db.query(
            `INSERT INTO documents (name, folder_id, content, created_by, updated_by) VALUES (?, ?, '', ?, ?);`,
            [name, folder_id, created_by, created_by]
        );
        res.status(201).json(await findFile(result.insertId));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Update one file
export const updateFile = async (req, res) => {
    try {
        const [result] = await db.query(`UPDATE documents SET ? WHERE id = ?;`, [req.body, req.params.id]);
        if (result.affectedRows === 0) {return res.status(404).json({ error: 'File not found' });}
        res.json(await findFile(req.params.id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Delete one file
export const deleteFile = async (req, res) => {
    try {
        const [result] = await db.query(`DELETE FROM documents WHERE id = ?;`, [req.params.id]);
        if (result.affectedRows === 0) {return res.status(404).json({ error: 'File not found' });}
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};
