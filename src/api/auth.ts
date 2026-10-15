import { fetchApi } from "./client";

import type { LoginCredentials, User } from "../types/Auth";

/** POST /auth/login : backend use httpOnly cookie to store the session (JWT), so we don't need to handle the token in the frontend. */
export function apiLogin(payload: LoginCredentials): Promise<void> {
	return fetchApi<void>("/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** GET /auth/me : récupère l'utilisateur connecté. */
export function getCurrentUser(): Promise<User> {
	return fetchApi<User>("/auth/me");
}

/** POST /auth/logout : invalide la session côté serveur. */
export function apiLogout(): Promise<void> {
	return fetchApi<void>("/auth/logout", {
		method: "POST",
	});
}
