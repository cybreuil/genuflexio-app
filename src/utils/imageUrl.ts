/**
 * Storage layout:
 * `/images/saints/name.webp`            original
 * `/images/saints/400/name.webp`        resized variant
 * `/images/feats/400/assumption.webp`   resized variant
 *
 * Keep THUMB_WIDTHS in sync with the backend.
 */
export const THUMB_WIDTHS = [400, 800] as const;
export type ThumbWidth = (typeof THUMB_WIDTHS)[number];

export function variantUrl(url: string, width: ThumbWidth): string {
	return url.replace(
		/^(https?:\/\/[^/]+)?(\/images\/.+)\/([^/]+)$/,
		`$1$2/${width}/$3`,
	);
}
