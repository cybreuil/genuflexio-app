import type { Image } from "../types/Image";

const ROMAN: [number, string][] = [
	[1000, "M"],
	[900, "CM"],
	[500, "D"],
	[400, "CD"],
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

export function toRoman(value: number): string {
	let n = Math.floor(value);
	if (n <= 0) return String(value);
	let out = "";
	for (const [num, glyph] of ROMAN) {
		while (n >= num) {
			out += glyph;
			n -= num;
		}
	}
	return out;
}

export function toEnglishOrdinal(value: number): string {
	const mod100 = value % 100;

	if (mod100 >= 11 && mod100 <= 13) {
		return `${value}th`;
	}

	switch (value % 10) {
		case 1:
			return `${value}st`;
		case 2:
			return `${value}nd`;
		case 3:
			return `${value}rd`;
		default:
			return `${value}th`;
	}
}

type Translate = (
	key: string,
	options?: Record<string, string | number>,
) => string;

export function centuryLabel(
	century: number | null | undefined,
	t: Translate,
): string | null {
	if (century == null) return null;

	return t(
		century === 1 ? "century.centuryLabelFirst" : "century.centuryLabel",
		{
			centuryRoman: toRoman(century),
			centuryEnglish: toEnglishOrdinal(century),
		},
	);
}

export type PartialDate = {
	year: number | null | undefined;
	month?: number | null;
	day?: number | null;
	approximate?: boolean | null;
};

export function formatPartialDate(
	{ year, month, day, approximate }: PartialDate,
	languageCode: string,
): string {
	if (year == null) return "—";
	const prefix = approximate ? "v. " : "";
	if (year < 0) return `${prefix}${Math.abs(year)} av. J.-C.`;
	if (month == null) return `${prefix}${year}`;

	try {
		const date = new Date(year, month - 1, day ?? 1);
		date.setFullYear(year); // années < 100
		const options: Intl.DateTimeFormatOptions =
			day == null
				? { month: "long", year: "numeric" }
				: { day: "numeric", month: "long", year: "numeric" };
		return (
			prefix + new Intl.DateTimeFormat(languageCode, options).format(date)
		);
	} catch {
		return `${prefix}${year}`;
	}
}

/** Image de couverture : is_primary sinon la première par sort_order. */
export function primaryImage(images: Image[] | null | undefined): Image | null {
	if (!images?.length) return null;
	return (
		images.find((img) => img.is_primary) ??
		[...images].sort((a, b) => a.sort_order - b.sort_order)[0]
	);
}
