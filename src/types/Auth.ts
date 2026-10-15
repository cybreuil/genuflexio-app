export interface AuthContextType {
	user: User | null;
	isAuthLoading: boolean;
	isAdmin: boolean;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<User | null>;
}

export interface User {
	id: string;
	role: string;
}

export interface LoginCredentials {
	id: string;
	password: string;
}

export type LoginResponse = {
	token: string;
	expires_at?: string; // ISO 8601, optionnel
};
