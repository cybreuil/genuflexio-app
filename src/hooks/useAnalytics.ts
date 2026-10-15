import { useEffect, useState } from "react";
import { getVisitStats, getVisits } from "../api/analytics";
import type {
	Visit,
	VisitStats,
	VisitsRange,
} from "../types/Analytics";

function toError(error: unknown, fallback: string): Error {
	return error instanceof Error ? error : new Error(fallback);
}

const useVisitStats = (range: VisitsRange) => {
	const [stats, setStats] = useState<VisitStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		setLoading(true);
		setError(null);

		getVisitStats(range, controller.signal)
			.then(setStats)
			.catch((error) => {
				if (error.name === "AbortError") return;
				setError(toError(error, "Impossible to fetch visit stats."));
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});

		return () => controller.abort();
	}, [range]);

	return { stats, loading, error };
};

type UseVisitsParams = {
	page: number;
	perPage?: number;
	range: VisitsRange;
};

const useVisits = ({ page, perPage = 25, range }: UseVisitsParams) => {
	const [visits, setVisits] = useState<Visit[]>([]);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		setLoading(true);
		setError(null);

		getVisits({ page, perPage, range, signal: controller.signal })
			.then((response) => {
				setVisits(response.data);
				setTotal(response.total);
				setTotalPages(response.total_pages);
			})
			.catch((error) => {
				if (error.name === "AbortError") return;
				setError(toError(error, "Impossible to fetch visits."));
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});

		return () => controller.abort();
	}, [page, perPage, range]);

	return { visits, total, totalPages, loading, error };
};

export { useVisitStats, useVisits };
