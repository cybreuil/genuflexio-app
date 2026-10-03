export type Image = {
	id: number;
	saint_id: number;
	image_url: string;
	title: string;
	image_type?: string;
	alt_text?: string;
	caption?: string;
	creator?: string;
	date_label?: string;
	repository?: string;
	credit?: string;
	license?: string;
	source_url?: string;
	sort_order: number;
	is_primary: boolean;

	// Enrichissement galerie — à exposer côté API sur GET /images
	saint_name?: string | null;
	saint_slug?: string | null;
	year?: number | null; // année (approx.) pour le tri / filtre période
	width?: number | null; // dimensions natives pour la masonry sans reflow
	height?: number | null;
};

export type ImagesListApiResponse = {
	page: number;
	total: number;
	total_pages: number;
	data: Image[];
};

export type GetWallImagesParams = {
	limit?: number;
	offset?: number;
	seed?: string;
	q?: string;
	saint_id?: number;
	artist?: string;
	museum?: string;
	century?: number;
	sort?: "title" | "artist" | "century_asc" | "century_desc";
};

export type ImagesListWallResponse = {
	data: Image[];
	total: number;
	has_more: boolean;
};
