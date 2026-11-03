import { useCallback, useEffect, useState, type ReactNode } from "react";

import { AuthContext } from "./AuthContext";
import { apiLogin, apiLogout, apiRefresh, getCurrentUser } from "../api/auth";
import { ApiError } from "../api/client";

import type { AuthContextType, LoginCredentials, User } from "../types/Auth";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);

	const refreshUser = useCallback(async (): Promise<User | null> => {
		try {
			const currentUser = await getCurrentUser();
			setUser(currentUser);
			return currentUser;
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				setUser(null);
				return null;
			}
			throw error;
		}
	}, []);

	// Restauration de session : on échange le cookie refresh contre un access
	// token, puis on charge l'utilisateur. Un 401 = simplement pas connecté.
	useEffect(() => {
		let cancelled = false;

		async function initializeAuth() {
			try {
				const res = await apiRefresh();
				const currentUser = res.user;
				if (!cancelled) setUser(currentUser);
			} catch (error) {
				if (cancelled) return;
				setUser(null);
				if (!(error instanceof ApiError && error.status === 401)) {
					console.error("Erreur de restauration de session :", error);
				}
			} finally {
				if (!cancelled) setIsAuthLoading(false);
			}
		}

		void initializeAuth();

		return () => {
			cancelled = true;
		};
	}, []);

	const login = useCallback(
		async (credentials: LoginCredentials): Promise<void> => {
			const res = await apiLogin(credentials);

			setUser(res.user);
		},
		[],
	);

	const logout = useCallback(async (): Promise<void> => {
		try {
			await apiLogout();
		} finally {
			setUser(null);
		}
	}, []);

	const value: AuthContextType = {
		user,
		isAuthLoading,
		isAdmin: user?.role === "admin",
		login,
		logout,
		refreshUser,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
