import fs from 'node:fs';
import * as Y from 'yjs';

// pas encore de BDD donc on utilise les .txt du dossier files/
const FOLDER = './files/';

export const files = fs.readdirSync(FOLDER);

const docs = {};
const timers = {};

export function getDoc(name) {
	if (!docs[name]) {
		docs[name] = new Y.Doc();
		docs[name].getText('content').insert(0, fs.readFileSync(FOLDER + name, 'utf8'));
	}
	return docs[name];
}

export function updateDoc(name, update) {
	Y.applyUpdate(getDoc(name), update);

	// sauvegarde 1s après la dernière modif
	clearTimeout(timers[name]);
	timers[name] = setTimeout(() => {
		fs.writeFileSync(FOLDER + name, getDoc(name).getText('content').toString());
		console.log(`${name} sauvegardé`);
	}, 1000);
}
