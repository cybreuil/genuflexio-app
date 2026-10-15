/* =========================================================
   ANALYTICS — visites du site
   Contrat côté front, à aligner avec l'API.
   ========================================================= */

/** Payload envoyé au premier chargement du site (POST /visits). */
export type VisitPayload = {
	/** Chemin d'entrée (ex: "/celebration/2026-10-15") */
	path: string;
	/** document.referrer, vide si accès direct */
	referrer: string;
	/** Langue de l'interface choisie par l'utilisateur */
	language: string;
	/** Fuseau horaire IANA du navigateur */
	timezone: string;
	/** Largeur du viewport en px (utile pour deviner le device) */
	screen_width: number;
	/** Thème actif au chargement */
	theme: string;
};

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

/** Une visite telle que renvoyée par l'API (enrichie côté serveur : IP, géoloc, UA parsé). */
export type Visit = {
	id: number;
	visited_at: string; // ISO 8601
	ip: string;
	country_code: string | null; // ISO 3166-1 alpha-2 ("FR")
	country_name: string | null;
	city: string | null;
	device: DeviceType;
	browser: string | null;
	os: string | null;
	path: string;
	referrer: string | null;
	language: string | null;
	timezone: string | null;
	/** true si l'IP n'avait jamais été vue sur la période de rétention */
	is_new_visitor: boolean;
};

export type VisitsRange = "7d" | "30d" | "90d" | "all";

export type DailyCount = {
	date: string; // "YYYY-MM-DD"
	visits: number;
	unique_visitors: number;
};

export type LabelledCount = {
	label: string;
	count: number;
};

export type CountryCount = {
	country_code: string;
	country_name: string;
	count: number;
};

/** Agrégats globaux (GET /visits/stats?range=30d). */
export type VisitStats = {
	range: VisitsRange;
	total_visits: number;
	unique_visitors: number;
	visits_today: number;
	visits_yesterday: number;
	countries_count: number;
	new_visitors_ratio: number; // 0..1
	daily: DailyCount[];
	top_countries: CountryCount[];
	top_devices: LabelledCount[];
	top_browsers: LabelledCount[];
	top_referrers: LabelledCount[];
	top_languages: LabelledCount[];
	top_paths: LabelledCount[];
};

/** Liste paginée (GET /visits?page=1&per_page=25). */
export type VisitsListResponse = {
	data: Visit[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
};
