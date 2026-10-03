import { fetchApi } from "./client";
import {
	type ImagesListApiResponse,
	type Image,
	type GetWallImagesParams,
	type ImagesListWallResponse,
} from "../types/Image";

export function getImages(
	page: number = 1,
	perPage: number = 20,
	// isRandom: boolean = false,
): Promise<ImagesListApiResponse> {
	return fetchApi<ImagesListApiResponse>(
		`/images?page=${page}&per_page=${perPage}`,
	);
}

export function getRandomImages(count: number = 1): Promise<Image[]> {
	const params = new URLSearchParams({
		count: String(count),
	});

	return fetchApi<Image[]>(`/saints/random-images?${params.toString()}`);
}

// HELPER
function toQueryParams(
	params: Record<string, string | number | undefined>,
): string {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			searchParams.set(key, String(value));
		}
	}

	return searchParams.toString();
}

export function getWallImages(
	params: GetWallImagesParams = {},
): Promise<ImagesListWallResponse> {
	const query = toQueryParams(params);

	return fetchApi<ImagesListWallResponse>(
		`/images/wall${query ? `?${query}` : ""}`,
	);
}
