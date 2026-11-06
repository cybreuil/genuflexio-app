import type { Image } from "../types/Image";

/** Tranche de période : "XVe siècle" à partir de `year`, sinon depuis `date_label`. */
export function periodOf(img: Image): string | null {
	const year = img.date_label
		? parseInt(img.date_label.match(/\d{3,4}/)?.[0] ?? "", 10)
		: NaN;
	if (!year || Number.isNaN(year)) return null;
	const century = Math.floor((year - 1) / 100) + 1;
	return `${century}`;
}

export function periodLabel(century: string): string {
	const n = Number(century);
	if (!n) return century;
	const roman = toRomanSimple(n);
	return `${roman}${n === 1 ? "er" : "e"} siècle`;
}

function toRomanSimple(n: number): string {
	const map: [number, string][] = [
		[100, "C"],
		[90, "XC"],
		[50, "L"],
		[40, "XL"],
		[10, "X"],
		[9, "IX"],
		[5, "V"],
		[4, "IV"],
		[1, "I"],
	];
	let out = "";
	for (const [v, g] of map)
		while (n >= v) {
			out += g;
			n -= v;
		}
	return out;
}

/** Cartel type musée : « Titre — Créateur, date, musée » */
export function cartel(img: Image): string {
	return [img.creator, img.date_label, img.repository]
		.filter(Boolean)
		.join(", ");
}
