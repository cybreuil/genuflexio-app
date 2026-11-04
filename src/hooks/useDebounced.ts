import { useEffect, useState } from "react";

/** Returns `value` once it has stopped changing for `delay` ms. */
function useDebounced<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);

	return debounced;
}

export { useDebounced };
