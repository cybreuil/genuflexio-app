import { fetchApi, setAccessToken } from "./client";

import type { LoginCredentials, LoginResponse, User } from "../types/Auth";

/**
 * POST /auth/login
 * Le back pose le refresh token en cookie httpOnly (scopé /auth) et renvoie
 * l'access token dans le body : on le garde en mémoire via setAccessToken.
 */
export async function apiLogin(payload: LoginCredentials): Promise<void> {
	const data = await fetchApi<LoginResponse>("/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	setAccessToken(data.access_token);
}

/**
 * POST /auth/refresh
 * Utilise le cookie refresh pour obtenir un nouvel access token.
 * À appeler au démarrage de l'app (restauration de session après F5).
 */
export async function apiRefresh(): Promise<void> {
	const data = await fetchApi<LoginResponse>("/auth/refresh", {
		method: "POST",
	});
	setAccessToken(data.access_token);
}

/** GET /auth/me : récupère l'utilisateur connecté (nécessite un access token). */
export function getCurrentUser(): Promise<User> {
	return fetchApi<User>("/auth/me");
}

/** POST /auth/logout : révoque le refresh token et vide le cookie. */
export async function apiLogout(): Promise<void> {
	try {
		await fetchApi<unknown>("/auth/logout", { method: "POST" });
	} finally {
		setAccessToken(null);
	}
}
