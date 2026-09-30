import { Router } from 'express';
import {
    getFiles, getFile, createFile, updateFile, deleteFile,
    getMembers, inviteMember, removeMember,
} from '../controllers/filesController.js';

const filesRoutes = Router();

filesRoutes.get('/', getFiles);
filesRoutes.get('/:id', getFile);
filesRoutes.post('/', createFile);
filesRoutes.put('/:id', updateFile);
filesRoutes.delete('/:id', deleteFile);

filesRoutes.get('/:id/members', getMembers);
filesRoutes.post('/:id/members', inviteMember);
filesRoutes.delete('/:id/members/:userId', removeMember);

export default filesRoutes;
