import type { Attribute } from "./Attribute";
import type { Image } from "./Image";
import type { Place } from "./Place";
import type { Patronage } from "./Patronage";
import type { FacetMap } from "./Facet";

/** Facets the saints list endpoint can aggregate. */
export type SaintFacetKey =
	"century" | "title" | "order" | "symbol" | "patronage";

export interface Saint {
	id: string;
	name: string;
	feastDay: string;
	description: string;
	biography: string[];
	attributes: string[];
	patronage: string[];
	image: string;
}

//API dto for lists
export interface SaintApi {
	id: string;
	slug: string;
	default_name: string;
	// Name traduit depuis saint_translations
	name: string;
	century?: number;
	life_label?: string;
	image_url: string;
}
export interface SaintsListApiResponse {
	data: SaintApi[];
	page: number;
	// perPage: number;
	total: number;
	total_pages: number;
	/** Present when `include_facets` was requested. */
	facets?: FacetMap<SaintFacetKey>;
}

export interface SaintDetailedResponse {
	id: number;
	slug: string;
	default_name: string;
	birth_year: number | null;
	birth_month: number | null;
	birth_day: number | null;
	birth_is_approximate: boolean | null;
	death_year: number | null;
	death_month: number | null;
	death_day: number | null;
	death_is_approximate: boolean | null;
	century: number | null;
	name: string | null;
	short_description: string | null;
	full_biography: string | null;

	// No life_label on detailed, maybe should fix this
	// life_label?: string | null;
	images?: Image[] | null;
	patronages?: Patronage[] | null; // ex. « des voyageurs », « de la France »
	attributes?: Attribute[] | null; // attributs iconographiques : « clés », « palme »
	places?: Place[] | null; // ex. « Rome », « Paris »
}

export type GetSaintsParams = {
	page?: number;
	perPage?: number;
	languageCode?: string;
	q?: string;
	century?: string;
	sort?: string;
	/** Attribute codes (title / order / symbol), e.g. ["virgin", "martyr"]. */
	attributes?: string[];
	/** Patronage codes. */
	patronages?: string[];
	include_facets?: boolean;
	signal?: AbortSignal;
};

export type GetSaintBySlugParams = {
	slug: string;
	languageCode?: string;
	signal?: AbortSignal;
};
