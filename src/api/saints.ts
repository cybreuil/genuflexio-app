import { fetchApi } from "./client";
import type {
	SaintDetailedResponse,
	SaintsListApiResponse,
	GetSaintsParams,
} from "../types/Saint";

export function getSaints({
	page = 1,
	perPage = 20,
	languageCode = "en",
	q,
	century,
	sort,
	attributes,
	patronages,
	include_facets,
	signal,
}: GetSaintsParams = {}): Promise<SaintsListApiResponse> {
	const params = new URLSearchParams({
		page: String(page),
		per_page: String(perPage),
		language_code: languageCode,
	});

	if (q?.trim()) {
		params.set("q", q.trim());
	}

	if (century && century !== "all") {
		params.set("century", century);
	}

	if (sort) {
		params.set("sort", sort);
	}

	// Multi-valued filters are sent comma-separated: ?attributes=virgin,martyr
	if (attributes?.length) {
		params.set("attributes", attributes.join(","));
	}

	if (patronages?.length) {
		params.set("patronages", patronages.join(","));
	}

	if (include_facets) {
		params.set("include_facets", "1");
	}

	return fetchApi<SaintsListApiResponse>(`/saints?${params.toString()}`, {
		signal,
	});
}

export async function getSaintBySlug(
	slug: string,
	languageCode = "en",
	signal?: AbortSignal,
): Promise<SaintDetailedResponse> {
	const params = new URLSearchParams({
		language_code: languageCode,
	});

	return fetchApi<SaintDetailedResponse>(
		`/saints/${slug}?${params.toString()}`,
		{ signal },
	);
}
