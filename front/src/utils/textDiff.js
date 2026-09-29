export function diff(before, after) {
	let start = 0;
	while (start < before.length && before[start] === after[start]) start++;

	let end = 0;
	while (end < before.length - start && end < after.length - start
		&& before[before.length - 1 - end] === after[after.length - 1 - end]) {
		end++;
	}

	return { start, removed: before.length - start - end, inserted: after.length - start - end };
}

export function shift(index, change) {
	if (index <= change.start) return index;
	if (index >= change.start + change.removed) return index - change.removed + change.inserted;
	return change.start + change.inserted;
}
