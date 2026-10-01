import bcrypt   from 'bcrypt';
import jwt      from 'jsonwebtoken';
import * as users from '../models/userModel.js';

// Sign-in route
export const login = async (req, res) => {
	const {email, password} = req.body || {};

	// Checking validity of given informations
	if(typeof email !== 'string' || !email || typeof password !== 'string' || !password){
		return res.status(400).json({ message: "Email et mot de passe requis." });
	};
	const normalizedEmail = email.trim().toLowerCase();

	try{
		// Looking for an existing account into the database
		const account = await users.findByEmailWithPassword(normalizedEmail);

		// Checking found account's credentials and blocked status
		if(!account || !(await bcrypt.compare(password, account.password_hash))){return res.status(401).json({message: "Identifiants incorrects."});};
		if(account.is_blocked){return res.status(403).json({message: "Ce compte a été banni."});};

		// Signing the user in
		const user = {
			id:           account.id,
			email:        account.email,
			first_name:   account.first_name,
			last_name:    account.last_name,
			role:         account.role,
			is_blocked:   account.is_blocked,
			totp_enabled: account.totp_enabled,
		};
		const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '3d'});
		res.status(200).json({user, token});
	}
	catch(err){
		res.status(500).json({message: "Une erreur est survenue lors de la connexion."});
	};
};

// Registration route
export const register = async (req, res) => {
	const {password} = req.body || {};
	const first_name = typeof req.body?.first_name === 'string' ? req.body.first_name.trim()            : '';
	const last_name  = typeof req.body?.last_name  === 'string' ? req.body.last_name.trim()             : '';
	const email      = typeof req.body?.email      === 'string' ? req.body.email.trim().toLowerCase()   : '';

	// Checking validity of given informations
	if(
		!first_name ||
		!last_name  ||
		!email      ||
		typeof password !== 'string' ||
		password.length < 8
	){
		return res.status(400).json({message: "Prénom, nom, email, et/ou mot de passe de plus de 8 caractères requis."});
	};
	if(first_name.length > 100 || last_name.length > 100 || email.length > 255){
		return res.status(400).json({message: "Prénom et nom : 100 caractères maximum, email : 255."});
	};
	if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
		return res.status(400).json({message: "L'adresse email n'est pas valide."});
	};

	try{
		// Hashing user's password
		const password_hash = await bcrypt.hash(password, 12);

		// Inserting the new user into the database, create renvoie le compte avec son id
		const account = await users.create({firstName: first_name, lastName: last_name, email, passwordHash: password_hash});

		// Signing the new user in
		const user = {
			id:           account.id,
			email:        account.email,
			first_name:   account.first_name,
			last_name:    account.last_name,
			role:         account.role,
			is_blocked:   account.is_blocked,
			totp_enabled: account.totp_enabled,
		};
		const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '3d'});
		res.status(201).json({user, token});
	}
	catch(err){
		if(err.code === 'ER_DUP_ENTRY'){
			return res.status(409).json({message: "Email déjà utilisé par un autre compte."});
		};
		res.status(500).json({message: "Une erreur est survenue lors de la création du compte."});
	};
};
