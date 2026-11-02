const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
	public readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

/* ===== Access token (en mémoire uniquement) =====
 * Le refresh token vit dans un cookie httpOnly géré par le back ;
 * l'access token (JWT court) ne quitte jamais la mémoire JS.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

export function getAccessToken(): string | null {
	return accessToken;
}

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
	const headers = new Headers(init?.headers);
	if (init?.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	if (accessToken && !headers.has("Authorization")) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...init,
		headers,
		credentials: "include",
	});

	if (response.status === 204) {
		return undefined as T;
	}

	const body = await response.json().catch(() => null);

	if (!response.ok) {
		// Le back renvoie toujours { status, error }
		const payload = body as { error?: string; message?: string } | null;

		throw new ApiError(
			response.status,
			payload?.error ??
				payload?.message ??
				response.statusText ??
				"Unknown error",
		);
	}

	return body as T;
}

export { fetchApi };
