function pad(n: number) {
	return n.toString().padStart(2, "0");
}

// Format Date -> nous donne une string "YYYY-MM-DD" en LOCAL !!
// Permet d'éviter les problèmes de timezone qui peuvent survenir avec toISOString() ou new Date("YYYY-MM-DD") qui sont basés sur UTC.
export function formatYMD(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parse "YYYY-MM-DD" as local date (midnight local)
// Note: new Date("YYYY-MM-DD") is parsed as UTC, which can cause off-by-one-day issues depending on timezone. So we parse manually.
// Nous renvoie une date locale correspondant à la date indiquée, sans décalage de timezone. Par exemple, "2024-06-15" sera toujours interprété comme le 15 juin 2024 à minuit local, même si l'utilisateur est dans un fuseau horaire différent.
export function parseYMD(s: string): Date {
	const [y, m, day] = s.split("-").map(Number);
	return new Date(y, m - 1, day);
}

// Nous renvoie le string du jour LOCAL au format "YYYY-MM-DD". Par exemple, si aujourd'hui est le 15 juin 2024, cette fonction retournera "2024-06-15", même si l'utilisateur est dans un fuseau horaire différent.
export function getTodayStr(): string {
	return formatYMD(new Date());
}
// Nous renvoie la date du jour à minuit local, sans composant temporel. Par exemple, si aujourd'hui est le 15 juin 2024, cette fonction retournera une Date représentant le 15 juin 2024 à 00:00:00 local.
export function getToday(): Date {
	const today = parseYMD(formatYMD(new Date()));
	return today;
}

//CALCUL DIFF 2 DATES
// helper: compute a stable day index (UTC days since epoch) to avoid DST issues
function dayIndexUTC(d: Date): number {
	return Math.floor(
		Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
	);
}
// difference in whole days between two YYYY-MM-DD strings (b - a)
export function daysBetweenYMD(a: string, b: string): number {
	return dayIndexUTC(parseYMD(b)) - dayIndexUTC(parseYMD(a));
}

// Strict validation: format AND real calendar date ("2024-02-31" is rejected
// because parse → format does not round-trip).
export function isValidYMD(s: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(s) && formatYMD(parseYMD(s)) === s;
}

export function addDays(d: Date, n: number): Date {
	const r = new Date(d);
	r.setDate(r.getDate() + n);
	return r;
}

export function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
	return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// 6 × 7 grid, weeks start on Monday (liturgical convention, matches MiniCalendar).
export function getMonthGrid(month: Date): Date[] {
	const first = startOfMonth(month);
	const shift = (first.getDay() + 6) % 7; // Monday = 0
	const gridStart = addDays(first, -shift);
	return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
