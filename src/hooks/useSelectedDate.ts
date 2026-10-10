import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTodayStr, isValidYMD } from "../utils/date";

/**
 * Single source of truth for the date shown on the celebration page.
 * Reads `/celebration/:date`, validates it, and exposes navigation helpers.
 */
export function useSelectedDate() {
	const { date: param } = useParams<{ date: string }>();
	const navigate = useNavigate();

	const today = getTodayStr();
	const isValid = param === undefined || isValidYMD(param);
	// Raw value is kept so the page can show an "invalid date" state;
	// consumers that need a safe date use `safeDate`.
	const date = param ?? today;
	const safeDate = isValid ? date : today;

	const select = useCallback(
		(next: string) => {
			if (next !== param) navigate(`/celebration/${next}`);
		},
		[navigate, param],
	);

	return {
		date,
		safeDate,
		today,
		isValid,
		isToday: safeDate === today,
		select,
		goToday: () => select(today),
	};
}
