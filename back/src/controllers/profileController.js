import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

export const changePassword = async (req, res) => {
	const {current_password, new_password} = req.body || {};

    // Checking validity of given informations
	if(
		typeof current_password !== 'string'    ||
		typeof new_password !== 'string'        ||
		!current_password                       ||
		!new_password
	){return res.status(400).json({message: "Les mots de passes saisies ne doivent pas être vides."});};

    // Changing the password hash into the database
	try{
		const password_hash = await bcrypt.hash(new_password, 12);
		await db.execute(
			'UPDATE users SET password_hash = ? WHERE id = ?',
			[password_hash, req.user.id]
		);
		res.status(201).json({message: "Le mot de passe a été modifié avec succès."});
	}
    catch(err){
		res.status(500).json({message: "Une erreur est survenue lors de la modification du mot de passe."});
	};
};

export const modifyUser = async (req, res) => {
	const {first_name, last_name, email} = req.body || {};

    // Checking validity of given informations
	if(
		typeof first_name !== 'string'  ||
		typeof last_name !== 'string'   ||
		typeof email !== 'string'       ||
		!first_name                     ||
		!last_name                      ||
        !email
	){return res.status(400).json({message: "Les informations saisies ne doivent pas être vides."});};

    // Changing the user's informations into the database
    try{
		await db.execute(
			`
				UPDATE users
				SET
					first_name	= ?, 
					last_name	= ?,
					email 		= ?
				WHERE id = ?
			`,
			[first_name.trim(), last_name.trim(), email.trim().toLowerCase(), req.user.id],
		);
		const user = {
			id: 			req.user.id,
			email: 			email.trim().toLowerCase(),
			first_name:		first_name.trim(),
			last_name: 		last_name.trim(),
			role: 			req.user.role,
			is_blocked: 	req.user.is_blocked,
			totp_enabled:	Boolean(req.user.totp_enabled),
		};
		res.status(201).json(user);
	}
	catch(err){
		res.status(500).json({message: "Une erreur est survenue lors de la modification des informations de l\'utilisateur."});
	};
};