import { Router }           from 'express';
import { changePassword }   from '../controllers/profileController.js';
import auth                 from '../middlewares/auth.js';

const profileRoutes = Router();

// Password changing route
profileRoutes.patch('/me/password', auth, changePassword);

export default profileRoutes;