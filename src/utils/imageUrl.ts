/**
 * Storage layout: `name.webp` is the original, `name-<width>.webp` a resized
 * variant. Keep the list in sync with whatever the backend generates.
 */
export const THUMB_WIDTHS = [400, 800] as const;
export type ThumbWidth = (typeof THUMB_WIDTHS)[number];

export function variantUrl(url: string, width: ThumbWidth): string {
	return url.replace(/^((?:https?:\/\/[^/]+)?\/[^/]+)\//, `$1/${width}/`);
}

/** `srcset` covering every generated width. */
export function thumbSrcSet(url: string): string {
	return THUMB_WIDTHS.map((w) => `${variantUrl(url, w)} ${w}w`).join(", ");
}
