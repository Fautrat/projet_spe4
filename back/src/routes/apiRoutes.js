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
import { changePassword, modifyUser } from '../controllers/profileController.js';
import {
	login,
	register,
	verifyTwoFactor,
	setupTwoFactor,
	enableTwoFactor,
	disableTwoFactor,
} from '../controllers/authController.js';
import { admin, connected, loginLimit } from '../middlewares/auth.js';
import { errorHandler } from '../middlewares/errors.js';
import { upload } from '../middlewares/upload.js';

// Chaque route indique qui peut l'appeler :
// connected = token valide et compte actif ; admin = connected + rôle admin
const apiRoutes = Router();

// Connexion et inscription (publiques)
apiRoutes.post('/auth/login', loginLimit, login);
apiRoutes.post('/auth/register', register);
apiRoutes.post('/auth/2fa/verify', loginLimit, verifyTwoFactor);

// Double authentification
apiRoutes.post('/auth/2fa/setup', connected, setupTwoFactor);
apiRoutes.post('/auth/2fa/enable', connected, enableTwoFactor);
apiRoutes.post('/auth/2fa/disable', connected, disableTwoFactor);

// Profils
apiRoutes.patch('/users/me', connected, modifyUser);
apiRoutes.patch('/users/me/password', connected, changePassword);

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