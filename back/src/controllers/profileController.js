import bcrypt from 'bcrypt';
import { HttpError, requireEmail, requireText } from '../middlewares/errors.js';
import * as users from '../models/userModel.js';

// PATCH /api/users/me/password avec { current_password, new_password }
export const changePassword = async (req, res) => {
	const { current_password, new_password } = req.body || {};

	// Checking validity of given informations
	if (typeof current_password !== 'string' || !current_password) {
		throw new HttpError(400, 'Le mot de passe actuel est obligatoire.');
	}
	if (typeof new_password !== 'string' || new_password.length < 8) {
		throw new HttpError(400, 'Le nouveau mot de passe doit faire au moins 8 caractères.');
	}

	const passwordHash = await users.findPasswordHash(req.user.id);
	if (!passwordHash || !(await bcrypt.compare(current_password, passwordHash))) {
		throw new HttpError(400, 'Le mot de passe actuel est incorrect.');
	}

	// Changing the password hash into the database
	await users.setPassword(req.user.id, await bcrypt.hash(new_password, 12));
	res.json({ message: 'Le mot de passe a été modifié avec succès.' });
};

// PATCH /api/users/me avec { first_name, last_name, email }, renvoie le user mis à jour
export const modifyUser = async (req, res) => {
	// Checking validity of given informations
	const firstName = requireText(req.body?.first_name, 'Le prénom', 100);
	const lastName = requireText(req.body?.last_name, 'Le nom', 100);
	const email = requireEmail(req.body?.email);

	// Changing the user's informations into the database
	try {
		const user = await users.updateProfile(req.user.id, { firstName, lastName, email });
		res.json(user);
	} catch (err) {
		if (err.code === 'ER_DUP_ENTRY') {
			throw new HttpError(409, 'Email déjà utilisé par un autre compte.');
		}
		throw err;
	}
};
