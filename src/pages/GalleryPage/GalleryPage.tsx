// NEED SEED RATIO IN IMAGE TABLE
import "./GalleryPage.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { getWallImages } from "../../api/images";
import type { Image } from "../../types/Image";
import { Loader } from "../../components/Loader/Loader";
import {
	GalleryFilters,
	DEFAULT_GALLERY_FILTERS,
	type GalleryFiltersValue,
} from "../../components/GalleryFilters/GalleryFilters";
import { ArtworkLightbox } from "../../components/ArtworkLightbox/ArtworkLightbox";
import { buildFacet, cartel } from "../../utils/artworkFormat";

/* ===== Animation presets ===== */

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
	hidden: { opacity: 0, y: 24 },
	show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const wallGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.035 } },
};

const tile = {
	hidden: { opacity: 0, y: 30, scale: 0.97 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.6, ease: EASE },
	},
};

/* ===== Masonry ===== */

const PAGE_SIZE = 40;

// Typical devotional painting is a portrait; used when the API has no dimensions.
const FALLBACK_RATIO = 1.3;
// Vertical gap expressed as a fraction of the column width (24px / ~320px).
const GAP_SCORE = 0.08;

function getColumnCount(width: number) {
	if (width < 640) return 1;
	if (width < 1024) return 2;
	if (width < 1400) return 3;
	return 4;
}

function useColumnCount() {
	const [count, setCount] = useState(() =>
		typeof window === "undefined" ? 4 : getColumnCount(window.innerWidth),
	);

	useEffect(() => {
		const onResize = () => setCount(getColumnCount(window.innerWidth));
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	return count;
}

function heightRatio(image: Image) {
	return image.width && image.height
		? image.height / image.width
		: FALLBACK_RATIO;
}

/**
 * Greedy "shortest column first" distribution.
 * Deterministic: for a given prefix of `images`, placement is identical,
 * so appending a page never moves tiles that are already on screen.
 */
function distribute(images: Image[], columnCount: number): Image[][] {
	const columns: Image[][] = Array.from({ length: columnCount }, () => []);
	const heights = new Array<number>(columnCount).fill(0);

	for (const image of images) {
		let shortest = 0;
		for (let i = 1; i < columnCount; i++) {
			if (heights[i] < heights[shortest]) shortest = i;
		}
		columns[shortest].push(image);
		heights[shortest] += heightRatio(image) + GAP_SCORE;
	}

	return columns;
}

function mergeUnique(current: Image[], incoming: Image[]) {
	const seen = new Set(current.map((i) => i.id));
	const fresh = incoming.filter((i) => !seen.has(i.id));
	return fresh.length ? [...current, ...fresh] : current;
}

/* ===== Page ===== */

const GalleryPage = () => {
	const [images, setImages] = useState<Image[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [total, setTotal] = useState(0);
	const [filters, setFilters] = useState<GalleryFiltersValue>(
		DEFAULT_GALLERY_FILTERS,
	);
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const [seed] = useState(() => String(Math.floor(Math.random() * 100000)));

	const offsetRef = useRef(0);
	const inFlightRef = useRef(false);
	const requestIdRef = useRef(0);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const columnCount = useColumnCount();

	// Derived, not stored: single source of truth is `images`.
	const columns = useMemo(
		() => distribute(images, columnCount),
		[images, columnCount],
	);

	// -------------------------
	// API
	// -------------------------

	const loadImages = useCallback(
		async (reset = false) => {
			if (inFlightRef.current) return;
			inFlightRef.current = true;

			if (reset) {
				setLoading(true);
				setError(null);
			} else {
				setLoadingMore(true);
			}

			const requestId = ++requestIdRef.current;
			const offset = reset ? 0 : offsetRef.current;

			try {
				const result = await getWallImages({
					limit: PAGE_SIZE,
					offset,
					seed,
					q: filters.query.trim() || undefined,
					saint_id: filters.saint ? Number(filters.saint) : undefined,
					artist: filters.artist || undefined,
					museum: filters.museum || undefined,
					century: filters.century
						? Number(filters.century)
						: undefined,
					sort:
						filters.sort === "random"
							? undefined
							: filters.sort === "period_asc"
								? "century_asc"
								: filters.sort === "period_desc"
									? "century_desc"
									: filters.sort,
				});

				if (requestId !== requestIdRef.current) return;

				setImages((current) =>
					reset ? result.data : mergeUnique(current, result.data),
				);
				setTotal(result.total);
				setHasMore(result.has_more);
				offsetRef.current = offset + result.data.length;
			} catch (e) {
				if (requestId !== requestIdRef.current) return;
				setError(e instanceof Error ? e : new Error(String(e)));
			} finally {
				if (requestId === requestIdRef.current) {
					setLoading(false);
					setLoadingMore(false);
					inFlightRef.current = false;
				}
			}
		},
		[filters, seed],
	);

	// Filters changed → start over. (Not tied to columnCount: resizing
	// must never refetch, the memo above re-distributes for free.)
	useEffect(() => {
		offsetRef.current = 0;
		inFlightRef.current = false;
		setImages([]);
		setHasMore(true);
		setOpenIndex(null);
		loadImages(true);
	}, [loadImages]);

	// Infinite scroll: load the next page when the sentinel approaches.
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasMore || loading) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) loadImages(false);
			},
			{ rootMargin: "800px 0px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loading, loadImages]);

	// -------------------------
	// Derived
	// -------------------------

	const facets = useMemo(
		() => ({
			saint: buildFacet(images, (i) => i.saint_name),
			artist: buildFacet(images, (i) => i.creator),
			period: buildFacet(
				images,
				(i) => (i.century != null ? String(i.century) : null),
				(i) => (i.century != null ? `${i.century}e siècle` : ""),
			).sort((a, b) => Number(a.value) - Number(b.value)),
			museum: buildFacet(images, (i) => i.repository),
		}),
		[images],
	);

	const indexById = useMemo(
		() => new Map(images.map((img, i) => [img.id, i])),
		[images],
	);

	const wallKey = useMemo(() => JSON.stringify(filters), [filters]);

	return (
		<div className="gallery-page">
			<motion.header
				className="gallery-header"
				variants={reveal}
				initial="hidden"
				animate="show"
			>
				<span className="gallery-header__eyebrow">─ Galerie</span>
				<h1 className="gallery-header__title">
					Les saints vus par les peintres
				</h1>
				<p className="gallery-header__text">
					Un mur d'œuvres, du domaine public, à parcourir librement.
					Filtrez par saint, artiste, période ou musée — puis entrez
					dans la salle.
				</p>
			</motion.header>

			<motion.div
				className="gallery-page__filters"
				variants={reveal}
				initial="hidden"
				animate="show"
				transition={{ delay: 0.1 }}
			>
				<GalleryFilters
					value={filters}
					onChange={setFilters}
					facets={facets}
					resultCount={images.length}
					totalCount={total}
				/>
			</motion.div>

			<AnimatePresence mode="wait">
				{loading ? (
					<motion.div
						key="loading"
						className="gallery-state"
						exit={{ opacity: 0 }}
					>
						<Loader size={56} />
					</motion.div>
				) : error ? (
					<motion.div
						key="error"
						className="gallery-state gallery-state--error"
					>
						Impossible de charger la galerie.
						<span className="gallery-state__detail">
							{error.message}
						</span>
					</motion.div>
				) : images.length === 0 ? (
					<motion.div
						key="empty"
						className="gallery-state"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						Aucune œuvre ne correspond à ces filtres.
					</motion.div>
				) : (
					<motion.div
						key={wallKey}
						className="gallery-wall-wrapper"
						exit={{ opacity: 0, transition: { duration: 0.2 } }}
					>
						<motion.div
							className="gallery-wall"
							style={
								{
									"--columns": columnCount,
								} as React.CSSProperties
							}
							variants={wallGroup}
							initial="hidden"
							animate="show"
						>
							{columns.map((column, columnIndex) => (
								<div
									className="gallery-column"
									key={columnIndex}
								>
									{column.map((img) => (
										<motion.div
											key={img.id}
											className="gallery-tile"
											variants={tile}
											style={
												img.width && img.height
													? {
															aspectRatio: `${img.width} / ${img.height}`,
														}
													: undefined
											}
										>
											<button
												type="button"
												className="gallery-tile__button"
												onClick={() =>
													setOpenIndex(
														indexById.get(img.id) ??
															null,
													)
												}
												aria-label={`${img.title}${
													img.creator
														? `, ${img.creator}`
														: ""
												}`}
											>
												<img
													src={img.image_url}
													alt=""
													width={
														img.width ?? undefined
													}
													height={
														img.height ?? undefined
													}
													loading="lazy"
													decoding="async"
													draggable={false}
												/>
												<span
													className="gallery-tile__frame"
													aria-hidden="true"
												/>
												<span className="gallery-tile__cartel">
													{img.saint_name && (
														<span className="gallery-tile__saint">
															{img.saint_name}
														</span>
													)}
													<span className="gallery-tile__title">
														{img.title}
													</span>
													{cartel(img) && (
														<span className="gallery-tile__meta">
															{cartel(img)}
														</span>
													)}
												</span>
											</button>
										</motion.div>
									))}
								</div>
							))}
						</motion.div>

						<div ref={sentinelRef} className="gallery-load-more">
							{loadingMore ? (
								<Loader size={32} />
							) : hasMore ? (
								<button
									type="button"
									onClick={() => loadImages(false)}
									className="gallery-load-more__button"
								>
									Charger plus
								</button>
							) : (
								<span className="gallery-load-more__end">
									─ Fin de la salle ─
								</span>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{openIndex !== null && images[openIndex] && (
					<ArtworkLightbox
						items={images}
						index={openIndex}
						onIndexChange={setOpenIndex}
						onClose={() => setOpenIndex(null)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

export { GalleryPage };
