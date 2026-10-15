import { fetchApi } from "./client";
import type {
	VisitPayload,
	VisitStats,
	VisitsListResponse,
	VisitsRange,
} from "../types/Analytics";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/**
 * Enregistre une visite. Fire-and-forget : on utilise `keepalive` pour que
 * la requête survive à une navigation/fermeture immédiate de l'onglet,
 * et on n'attend pas la réponse.
 */
export function logVisit(payload: VisitPayload): void {
	fetch(`${API_URL}/visits`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		keepalive: true,
	}).catch(() => {
		// Le tracking ne doit jamais casser l'app.
	});
}

export function getVisitStats(
	range: VisitsRange = "30d",
	signal?: AbortSignal,
): Promise<VisitStats> {
	const params = new URLSearchParams({ range });
	return fetchApi<VisitStats>(`/visits/stats?${params.toString()}`, {
		signal,
	});
}

type GetVisitsParams = {
	page?: number;
	perPage?: number;
	range?: VisitsRange;
	signal?: AbortSignal;
};

export function getVisits({
	page = 1,
	perPage = 25,
	range = "30d",
	signal,
}: GetVisitsParams = {}): Promise<VisitsListResponse> {
	const params = new URLSearchParams({
		page: String(page),
		per_page: String(perPage),
		range,
	});
	return fetchApi<VisitsListResponse>(`/visits?${params.toString()}`, {
		signal,
	});
}
