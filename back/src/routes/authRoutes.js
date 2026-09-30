import { Router }   from 'express';
import bcrypt       from 'bcrypt';
import { db }       from '../config/db.js';
// import passport from 'passport';

const authRoutes = Router();

// Google authentication route
// authRoutes.get('/g', passport.authenticate('google', {scope: ['profile', 'email']}));

// Google authentication callback route
// authRoutes.get(
//     '/g/callback',
//     passport.authenticate('google', { failureRedirect: '/' }), 
//     (req, res) => res.redirect('/')
// );

authRoutes.post('/register', async (req, res) => {
    const {first_name, last_name, email, password} = req.body;

    // Checking validity of given informations
    if(
        !first_name ||
        !last_name  ||
        !email      ||
        !password   ||
        password.length < 8
    ){
        return res.status(400).json({message: "Email et mot de passe de plus de 8 caractères requis."});
    };

    // Inserting the new user into the database
    try{
        const hash = await bcrypt.hash(password, 12);
        await db.execute(
            'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
            [first_name, last_name, email, hash]
        );
        res.status(201).json({message: "Compte créé avec succès !"});
    }
    catch(err){
        if(err.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({message: "Email déjà utilisé par un autre compte."});
        };
        res.status(500).json({message: "Une erreur est survenue lors de la création du compte."});
    };
});

export default authRoutes;