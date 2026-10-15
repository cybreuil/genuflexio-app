const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
	public readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
	const headers = new Headers(init?.headers);
	if (init?.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	// Simulate an error for testing purposes when the endpoint includes "/xxx"
	// if (endpoint.includes("/image")) {
	// 	throw new ApiError(500, "Erreur de test");
	// }

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
		const error = body as { message?: string } | null;

		throw new ApiError(
			response.status,
			error?.message ?? response.statusText ?? "Unknown error",
		);
	}

	return body as T;
}

export { fetchApi };
