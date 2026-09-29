import { createRouter, createWebHistory } from 'vue-router';
import { session } from '../stores/session.js';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import LibraryView from '../views/LibraryView.vue';
import DocumentView from '../views/DocumentView.vue';
import UsersView from '../views/UsersView.vue';
import ProfileView from '../views/ProfileView.vue';
import EditionView from '../views/EditionView.vue';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/login', name: 'login', component: LoginView },
		{ path: '/register', name: 'register', component: RegisterView },
		{ path: '/library/:folderId?', name: 'library', component: LibraryView },
		{ path: '/documents/:id', name: 'document', component: DocumentView },
		{ path: '/users', name: 'users', component: UsersView },
		{ path: '/profile', name: 'profile', component: ProfileView },
		{ path: '/edition', name: 'edition', component: EditionView },
		{ path: '/:pathMatch(.*)*', redirect: '/library' },
	],
});

const publicPages = ['login', 'register'];

router.beforeEach((to) => {
	const isPublic = publicPages.includes(to.name);

	if (!isPublic && !session.user) {
		return { name: 'login' };
	}
	if (isPublic && session.user) {
		return { name: 'library' };
	}
	if (to.name === 'users' && session.user.role !== 'admin') {
		return { name: 'library' };
	}
});

export default router;
