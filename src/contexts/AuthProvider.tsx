import {
	useCallback,
	useEffect,
	useState,
	useRef,
	type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

import { AuthContext } from "./AuthContext";
import { apiLogin, apiLogout, apiRefresh, getCurrentUser } from "../api/auth";
import { ApiError } from "../api/client";

import type { AuthContextType, LoginCredentials, User } from "../types/Auth";

const isAdminArea = (pathname: string) =>
	pathname.startsWith("/admin") || pathname.startsWith("/login");

export function AuthProvider({ children }: { children: ReactNode }) {
	const { pathname } = useLocation();
	const [user, setUser] = useState<User | null>(null);
	const [restoreDone, setRestoreDone] = useState(false);
	const isAuthLoading = isAdminArea(pathname) && !restoreDone;
	// Garantit une seule tentative de restauration par chargement de l'app,
	// que l'on arrive directement sur /admin ou qu'on y navigue depuis le site.
	const restoreAttempted = useRef(false);

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

	// Restauration de session (admin uniquement) : le cookie refresh renvoie un access token + l'utilisateur. Un 401 = simplement pas connecté.
	useEffect(() => {
		if (restoreAttempted.current || !isAdminArea(pathname)) return;
		restoreAttempted.current = true;

		async function restoreSession() {
			try {
				const res = await apiRefresh();
				setUser(res.user);
			} catch (error) {
				setUser(null);
				if (!(error instanceof ApiError && error.status === 401)) {
					console.error("Erreur de restauration de session :", error);
				}
			} finally {
				setRestoreDone(true);
			}
		}

		void restoreSession();
	}, [pathname]);

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
