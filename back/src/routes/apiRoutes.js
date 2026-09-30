import { Router } from 'express';
import {
	createUser,
	listUsers,
	setUserBlocked,
	setUserRole,
} from '../controllers/adminController.js';
import {
	createDocument,
	deleteDocument,
	downloadDocumentFile,
	getDocument,
	inviteMember,
	listInvitableUsers,
	listMembers,
	removeMember,
	replaceDocumentFile,
	updateDocument,
	uploadDocument,
} from '../controllers/documentController.js';
import { createFolder, deleteFolder, getFolderContents } from '../controllers/folderController.js';
import { admin, connected } from '../middlewares/auth.js';
import { errorHandler } from '../middlewares/errors.js';
import { upload } from '../middlewares/upload.js';
import authRoutes from './authRoutes.js';

// Chaque route indique qui peut l'appeler :
// connected = token valide et compte actif ; admin = connected + rôle admin
const apiRoutes = Router();

// Connexion et inscription (publiques)
apiRoutes.use('/auth', authRoutes);

// Dossiers
apiRoutes.get('/folders/:id', connected, getFolderContents);
apiRoutes.post('/folders', connected, createFolder);
apiRoutes.delete('/folders/:id', connected, deleteFolder);

// Documents
apiRoutes.post('/documents', connected, createDocument);
apiRoutes.post('/documents/upload', connected, upload.single('file'), uploadDocument);
apiRoutes.get('/documents/:id', connected, getDocument);
apiRoutes.patch('/documents/:id', connected, updateDocument);
apiRoutes.put('/documents/:id/file', connected, upload.single('file'), replaceDocumentFile);
apiRoutes.get('/documents/:id/file', connected, downloadDocumentFile);
apiRoutes.delete('/documents/:id', connected, deleteDocument);

// Invitations
apiRoutes.get('/documents/:id/members', connected, listMembers);
apiRoutes.get('/documents/:id/invitable', connected, listInvitableUsers);
apiRoutes.post('/documents/:id/members', connected, inviteMember);
apiRoutes.delete('/documents/:id/members/:userId', connected, removeMember);

// Administration
apiRoutes.get('/admin/users', admin, listUsers);
apiRoutes.post('/admin/users', admin, createUser);
apiRoutes.patch('/admin/users/:id', admin, setUserBlocked);
apiRoutes.patch('/admin/users/:id/role', admin, setUserRole);

apiRoutes.use(errorHandler);

export default apiRoutes;
