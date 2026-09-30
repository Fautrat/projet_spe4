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

// Check that a user created the file or is invited on it
const canAccess = async (fileId, userId) => {
    const [rows] = await db.query(
        `SELECT 1 FROM documents d
         WHERE d.id = ? AND (d.created_by = ? OR EXISTS (
             SELECT 1 FROM document_members m WHERE m.document_id = d.id AND m.user_id = ?
         ));`,
        [fileId, userId, userId]
    );
    return rows.length > 0;
};

// Get the files a user created or is invited on
export const getFiles = async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {return res.status(400).json({ error: 'user_id is required' });}

    try {
        const [files] = await db.query(
            `SELECT d.id, d.folder_id, d.name, d.file_path, d.updated_at, d.created_by, CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name
             FROM documents d JOIN users u ON u.id = d.updated_by
             WHERE d.created_by = ? OR d.id IN (SELECT document_id FROM document_members WHERE user_id = ?)
             ORDER BY d.updated_at DESC;`,
            [user_id, user_id]
        );
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Get one file
export const getFile = async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {return res.status(400).json({ error: 'user_id is required' });}

    try {
        const file = await findFile(req.params.id);
        if (!file) {return res.status(404).json({ error: 'File not found' });}
        if (!await canAccess(file.id, user_id)) {return res.status(403).json({ error: 'Access denied' });}
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

// Get the users invited on one file
export const getMembers = async (req, res) => {
    try {
        const [members] = await db.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, m.created_at
             FROM document_members m JOIN users u ON u.id = m.user_id
             WHERE m.document_id = ?
             ORDER BY m.created_at;`,
            [req.params.id]
        );
        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Invite one user on a file, found by email
export const inviteMember = async (req, res) => {
    const { email, invited_by } = req.body;
    if (!email || !invited_by) {return res.status(400).json({ error: 'email and invited_by are required' });}

    try {
        const [files] = await db.query(`SELECT created_by FROM documents WHERE id = ?;`, [req.params.id]);
        if (files.length === 0) {return res.status(404).json({ error: 'File not found' });}

        const [users] = await db.query(
            `SELECT id, email, first_name, last_name FROM users WHERE email = ?;`,
            [email.trim()]
        );
        if (users.length === 0) {return res.status(404).json({ error: 'User not found' });}
        if (users[0].id === files[0].created_by) {return res.status(409).json({ error: 'This user owns the file' });}

        await db.query(
            `INSERT INTO document_members (document_id, user_id, invited_by) VALUES (?, ?, ?);`,
            [req.params.id, users[0].id, invited_by]
        );
        res.status(201).json(users[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {return res.status(409).json({ error: 'User already invited' });}
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {return res.status(400).json({ error: 'invited_by is not a user' });}
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Remove one user from a file
export const removeMember = async (req, res) => {
    try {
        const [result] = await db.query(
            `DELETE FROM document_members WHERE document_id = ? AND user_id = ?;`,
            [req.params.id, req.params.userId]
        );
        if (result.affectedRows === 0) {return res.status(404).json({ error: 'Member not found' });}
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};
