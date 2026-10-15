import { useEffect } from "react";
import { logVisit } from "../api/analytics";
import { useLanguage } from "./useLanguage";
import { useTheme } from "./useTheme";

const SESSION_KEY = "genuflexio:visit-logged";

/**
 * Envoie un ping de visite une seule fois par session d'onglet, au premier
 * chargement du site (pas à chaque changement de route).
 *
 * - Ignoré en dev (import.meta.env.DEV) pour ne pas polluer les stats.
 * - Ignoré si l'utilisateur a activé "Do Not Track".
 * - Ignoré sur /admin : on ne compte pas nos propres passages.
 */
export function useVisitLogger() {
	const { languageCode } = useLanguage();
	const { theme } = useTheme();

	useEffect(() => {
		if (import.meta.env.DEV) return;
		if (navigator.doNotTrack === "1") return;
		if (window.location.pathname.startsWith("/admin")) return;

		try {
			if (sessionStorage.getItem(SESSION_KEY)) return;
			sessionStorage.setItem(SESSION_KEY, String(Date.now()));
		} catch {
			// sessionStorage indisponible (mode privé strict) : on log quand même.
		}

		logVisit({
			path: window.location.pathname,
			referrer: document.referrer,
			language: languageCode,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
			screen_width: window.innerWidth,
			theme,
		});
		// Volontairement sans dépendances : un seul tir au montage.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
