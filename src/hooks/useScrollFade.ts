import { useCallback, useRef, useState } from "react";

type Fade = { top: boolean; bottom: boolean };

/**
 * Tracks whether a scrollable element can still scroll up / down.
 * Returns a callback ref (works with conditionally rendered nodes) and the
 * fade state. Updates on scroll, resize, and content changes.
 */
export function useScrollFade<T extends HTMLElement>() {
	const [fade, setFade] = useState<Fade>({ top: false, bottom: false });
	const cleanupRef = useRef<(() => void) | null>(null);

	const ref = useCallback((node: T | null) => {
		cleanupRef.current?.();
		cleanupRef.current = null;
		if (!node) return;

		let frame = 0;
		const update = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const max = node.scrollHeight - node.clientHeight;
				const next = {
					top: node.scrollTop > 1,
					bottom: max > 1 && node.scrollTop < max - 1,
				};
				setFade((prev) =>
					prev.top === next.top && prev.bottom === next.bottom
						? prev
						: next,
				);
			});
		};

		node.addEventListener("scroll", update, { passive: true });
		const ro = new ResizeObserver(update);
		ro.observe(node);
		// Content growing/shrinking changes scrollHeight without resizing the box
		for (const child of node.children) ro.observe(child);
		update();

		cleanupRef.current = () => {
			cancelAnimationFrame(frame);
			node.removeEventListener("scroll", update);
			ro.disconnect();
		};
	}, []);

	return { ref, fade };
}
