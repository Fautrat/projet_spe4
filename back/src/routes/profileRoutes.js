import { Router }   from 'express';
import auth         from '../middlewares/auth.js';
import {
    changePassword,
    modifyUser
} from '../controllers/profileController.js';

const profileRoutes = Router();

profileRoutes.patch('/me', auth, modifyUser);
profileRoutes.patch('/me/password', auth, changePassword);

export default profileRoutes;