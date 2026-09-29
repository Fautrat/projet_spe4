export function formatDate(date) {
	return new Date(date).toLocaleString('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short',
	});
}

export function formatSize(bytes) {
	if (bytes < 1024) {
		return `${bytes} o`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} Ko`;
	}
	return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
