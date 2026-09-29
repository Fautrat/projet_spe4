import { Router } from 'express';
import { getFiles, getFile, createFile, updateFile, deleteFile } from '../controllers/filesController.js';

const filesRoutes = Router();

filesRoutes.get('/', getFiles);
filesRoutes.get('/:id', getFile);
filesRoutes.post('/', createFile);
filesRoutes.put('/:id', updateFile);
filesRoutes.delete('/:id', deleteFile);

export default filesRoutes;
