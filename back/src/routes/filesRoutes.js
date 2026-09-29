import { Router } from 'express';
import { getFiles, getFile, updateFile, deleteFile } from '../controllers/filesController.js';

const filesRoutes = Router();

filesRoutes.get('/', getFiles);
filesRoutes.get('/:id', getFile);
filesRoutes.put('/:id', updateFile);
filesRoutes.delete('/:id', deleteFile);

export default filesRoutes;
