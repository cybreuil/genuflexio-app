export interface AuthContextType {
	user: User | null;
	isAuthLoading: boolean;
	isAdmin: boolean;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<User | null>;
}

/** GET /auth/me */
export interface User {
	id: number;
	email: string;
	role: string;
}

/** POST /auth/login */
export interface LoginCredentials {
	email: string;
	password: string;
}

/** Réponse de /auth/login et /auth/refresh */
export type LoginResponse = {
	access_token: string;
	token_type: "Bearer";
	/** Durée de vie de l'access token, en secondes */
	expires_in: number;
	user: User;
};
