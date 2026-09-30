import bcrypt from 'bcrypt';
import { HttpError, requireEmail, requireText } from '../middlewares/errors.js';
import * as users from '../models/userModel.js';

// GET /api/admin/users
export async function listUsers(req, res) {
	res.json(await users.findAll());
}

// POST /api/admin/users : crée toujours un compte user, comme l'inscription
export async function createUser(req, res) {
	const firstName = requireText(req.body?.first_name, 'Le prénom', 100);
	const lastName = requireText(req.body?.last_name, 'Le nom', 100);
	const email = requireEmail(req.body?.email);
	const password = req.body?.password;

	if (typeof password !== 'string' || password.length < 8) {
		throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
	}
	if (await users.emailExists(email)) {
		throw new HttpError(409, 'Un compte existe déjà avec cet email.');
	}

	const passwordHash = await bcrypt.hash(password, 10);
	res.status(201).json(await users.create({ firstName, lastName, email, passwordHash }));
}

// PATCH /api/admin/users/:id
export async function setUserBlocked(req, res) {
	const { id } = req.params;
	if (typeof req.body?.is_blocked !== 'boolean') {
		throw new HttpError(400, 'is_blocked doit valoir true ou false.');
	}
	if (Number(id) === req.user.id) {
		throw new HttpError(400, 'Vous ne pouvez pas bloquer votre propre compte.');
	}

	const user = await users.setBlocked(id, req.body?.is_blocked);
	if (!user) {
		throw new HttpError(404, 'Utilisateur introuvable.');
	}
	res.json(user);
}

// PATCH /api/admin/users/:id/role avec { role } : adouber (admin) ou destituer (user)
export async function setUserRole(req, res) {
	const { id } = req.params;
	const role = req.body?.role;
	if (role !== 'user' && role !== 'admin') {
		throw new HttpError(400, 'Le rôle doit valoir user ou admin.');
	}
	if (Number(id) === req.user.id) {
		throw new HttpError(400, 'Vous ne pouvez pas changer votre propre rôle.');
	}

	const user = await users.setRole(id, role);
	if (!user) {
		throw new HttpError(404, 'Utilisateur introuvable.');
	}
	res.json(user);
}
