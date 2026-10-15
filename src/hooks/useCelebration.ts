import { useEffect, useState } from "react";
import { getCelebrationByDate } from "../api/celebrations";
import type { ApiError } from "../api/client";
import type {
	Celebration,
	LiturgicalSeasonFromCelebration,
	Saint,
	CelebrationContext,
} from "../types/Celebration";

const isValidDate = (dateStr: string) => {
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	if (!regex.test(dateStr)) return false;

	const d = new Date(dateStr);
	return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
};

export function useCelebration(
	calendarCode?: string,
	dateParam?: string,
	// Need fix
	languageCode?: string,
) {
	const [celebration, setCelebration] = useState<Celebration | null>(null);
	const [liturgicalSeason, setLiturgicalSeason] =
		useState<LiturgicalSeasonFromCelebration | null>(null);
	const [saints, setSaints] = useState<Saint[] | null>(null);
	const [context, setContext] = useState<CelebrationContext | null>(null);
	const [secondaryCelebrations, setSecondaryCelebrations] = useState<
		Celebration[] | null
	>(null);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<ApiError | Error | null>(null);

	const invalidDate = Boolean(dateParam && !isValidDate(dateParam));

	useEffect(() => {
		if (!calendarCode || invalidDate) {
			setCelebration(null);
			setSecondaryCelebrations(null);
			setLiturgicalSeason(null);
			setSaints(null);
			setContext(null);
			setError(null);
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		const load = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// If no date we use default time date actual
				const date = dateParam ? new Date(dateParam) : new Date();

				const body = await getCelebrationByDate(
					calendarCode,
					languageCode,
					date,
				);

				if (cancelled) return;

				setCelebration(body.celebrations[0] ?? null);
				setSecondaryCelebrations(body.celebrations.slice(1));
				setLiturgicalSeason(body.liturgical_season ?? null);
				setSaints(body.celebrations[0]?.saints ?? null);
				setContext(body.context ?? null);
			} catch (err) {
				if (cancelled) return;

				const error =
					err instanceof Error
						? err
						: new Error(
								"Unknown error occurred while fetching celebration data.",
							);

				setError(error);
				console.log("Error fetching celebration data:", error);
				setCelebration(null);
				setSecondaryCelebrations(null);
				setLiturgicalSeason(null);
				setSaints(null);
				setContext(null);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		load();

		return () => {
			cancelled = true;
		};
	}, [calendarCode, dateParam, invalidDate, languageCode]);

	return {
		celebration,
		secondaryCelebrations,
		liturgicalSeason,
		saints,
		context,
		isLoading,
		error,
		invalidDate,
		isValidDate,
	};
}
