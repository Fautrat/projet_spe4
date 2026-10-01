import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	// /api part vers le back : le navigateur reste sur la même origine, donc pas de CORS, même quand le front est ouvert depuis une autre adresse IP
	server: {
		host: true,
		proxy: { '/api': 'http://localhost:3000' },
	},
});
