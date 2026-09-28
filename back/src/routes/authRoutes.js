import { Router } from 'express';
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

export default authRoutes;