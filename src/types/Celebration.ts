// Full API response type for celebrations, including context and liturgical season information
export type CelebrationApiResponse = {
	context: CelebrationContext;
	liturgical_season: LiturgicalSeasonFromCelebration;
	celebrations: Celebration[];
};

export type CelebrationContext = {
	year: number;
	month: number;
	day: number;
	language_code: string;
	calendar_code: string;
};

export type LiturgicalSeasonFromCelebration = {
	code: string;
	segment_index: number;
	label: string;
	start: string;
	end: string;
	color_code: string;
	color_label: string;
	hex_color: string;
};

export type Celebration = {
	id: number;
	is_optional: boolean;
	notes: string;
	observance_type: string;
	default_name: string;
	feast_id: number;
	feast_name: string;
	feast_description: string;
	/** Illustration propre à la fête (Pâques, Noël…). Fallback quand aucun saint n'a d'image. */
	feast_cover_image_url: string;
	liturgical_color_name: string;
	liturgical_color_hex: string;
	rank_id: number;
	rank_code: string;
	rank_precedence: number;
	rank_label: string;
	saints: Saint[];
};
export type Saint = {
	saint_id: number;
	saint_slug: string;
	saint_name: string;
	saint_century?: string;
	saint_life_label?: string;
	saint_image_url: string;
};
