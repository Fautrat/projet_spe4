import { conn } from '../config/db.js';

const db = conn.promise();

// Get all files
export const getFiles = async (_req, res) => {
    try {
        const [files] = await db.query(
            `SELECT id, folder_id, name, mime_type, file_size, created_by, updated_by, created_at, updated_at
             FROM documents ORDER BY updated_at DESC;`
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
        const [files] = await db.query(`SELECT * FROM documents WHERE id = ?;`, [req.params.id]);
        if (files.length === 0) {return res.status(404).json({ error: 'File not found' });}
        res.json(files[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Update one file
export const updateFile = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {return res.status(400).json({ error: 'Nothing to update' });}

    try {
        const [result] = await db.query(`UPDATE documents SET ? WHERE id = ?;`, [req.body, req.params.id]);
        if (result.affectedRows === 0) {return res.status(404).json({ error: 'File not found' });}

        const [files] = await db.query(`SELECT * FROM documents WHERE id = ?;`, [req.params.id]);
        res.json(files[0]);
    } 
    catch (err){
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {return res.status(400).json({ error: 'Folder not found' });}
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
