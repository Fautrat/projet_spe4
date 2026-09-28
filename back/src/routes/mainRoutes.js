import { Router }               from 'express';
import { conn, getUserRole }    from '../config/db.js';

const mainRoutes = Router();

// Index route
const index = async (req, res) => {
    // Getting the user's role
    let user_email  = "";
    let user_role   = "";
    if(req.isAuthenticated()){
        user_email  = JSON.stringify((req.user)._json.email, null, 2).replace(/^"(.*)"$/, '$1')
        user_role   = await getUserRole(user_email);
    };

    // Getting the user's full name
    let full_name = "";
    if(req.isAuthenticated()){
        full_name = JSON.stringify((req.user).displayName, null, 2).replace(/^"(.*)"$/, '$1')
    };

    // Display the index page
    res.render('index', {
        is_authenticated: req.isAuthenticated(),
        role: user_role,
        full_name: full_name
    });
};
mainRoutes.get('/', index);

// Sign-up route
//TODO

// Login route
//TODO

// Logout route
const logout = (req, res) => {res.redirect('/');};
mainRoutes.get('/logout', logout);

export default mainRoutes;