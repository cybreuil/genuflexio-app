import type { LoginResponse } from "../types/Auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
	public status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = "ApiError";
	}
}

// ── Access token (mémoire uniquement, jamais en storage) ───────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
	accessToken = token;
}

export function getAccessToken() {
	return accessToken;
}

// ── Refresh ────────────────────────────────────────────────────────────────
// Une seule requête de refresh en vol à la fois : si N appels prennent un 401
// en parallèle, ils attendent tous la même promesse au lieu de déclencher N
// rotations (ce qui ferait révoquer les tokens à la chaîne côté back).

let refreshInFlight: Promise<LoginResponse> | null = null;

export function refreshSession(): Promise<LoginResponse> {
	if (!refreshInFlight) {
		refreshInFlight = (async () => {
			const res = await fetch(`${API_URL}/auth/refresh`, {
				method: "POST",
				credentials: "include",
			});
			if (!res.ok) {
				setAccessToken(null);
				throw new ApiError(res.status, "Session expirée");
			}
			const data = (await res.json()) as LoginResponse;
			setAccessToken(data.access_token);
			return data;
		})().finally(() => {
			refreshInFlight = null;
		});
	}
	return refreshInFlight;
}

// ── fetchApi ───────────────────────────────────────────────────────────────

async function parseError(res: Response): Promise<ApiError> {
	let message = res.statusText || "Erreur réseau";
	try {
		const body = await res.json();
		if (typeof body?.error === "string") message = body.error;
	} catch {
		// body vide ou non-JSON
	}
	return new ApiError(res.status, message);
}

async function rawFetch<T>(path: string, options: RequestInit): Promise<T> {
	const headers = new Headers(options.headers);
	if (!headers.has("Content-Type") && options.body) {
		headers.set("Content-Type", "application/json");
	}
	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}

	const res = await fetch(`${API_URL}${path}`, {
		...options,
		headers,
		credentials: "include",
	});

	if (!res.ok) throw await parseError(res);
	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}

export async function fetchApi<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	try {
		return await rawFetch<T>(path, options);
	} catch (err) {
		// 401 sur une route métier : on tente un refresh puis UN seul retry.
		// Les routes /auth/* sont exclues (sinon boucle infinie sur refresh/login).
		const shouldRetry =
			err instanceof ApiError &&
			err.status === 401 &&
			!path.startsWith("/auth/");

		if (!shouldRetry) throw err;

		try {
			await refreshSession();
		} catch {
			throw err; // refresh KO → on relance le 401 d'origine
		}
		return rawFetch<T>(path, options);
	}
}
