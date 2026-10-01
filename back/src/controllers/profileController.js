import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

export const changePassword = async (req, res) => {
	const {current_password, new_password} = req.body || {};

	if(
		typeof current_password !== 'string' ||
		typeof new_password !== 'string' ||
		!current_password ||
		!new_password
	){
		return res.status(400).json({message: "Les mots de passes saisies ne doivent pas être vides."});
	}

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