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

const PAGE_SIZE = 40;

// Helpers
function getColumnCount() {
	if (typeof window === "undefined") return 4;

	if (window.innerWidth < 640) return 1;
	if (window.innerWidth < 1024) return 2;
	return 4;
}

function imageHeightScore(image: Image) {
	if (!image.width || !image.height) return 1;

	return image.height / image.width;
}

function distributeImages(images: Image[], columnCount: number): Image[][] {
	const columns: Image[][] = Array.from({ length: columnCount }, () => []);

	const heights = Array(columnCount).fill(0);

	for (const image of images) {
		const columnIndex = heights.indexOf(Math.min(...heights));

		columns[columnIndex].push(image);
		heights[columnIndex] += imageHeightScore(image);
	}

	return columns;
}

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

	// Un seed stable pour tout le mur.
	const [seed] = useState(() => String(Math.floor(Math.random() * 100000)));

	const offsetRef = useRef(0);
	const loadingRef = useRef(false);
	const requestIdRef = useRef(0);

	const loadImages = useCallback(
		async (reset = false) => {
			if (loadingRef.current) return;

			loadingRef.current = true;

			if (reset) {
				setLoading(true);
				setError(null);
			} else {
				setLoadingMore(true);
			}

			const requestId = ++requestIdRef.current;

			try {
				const offset = reset ? 0 : offsetRef.current;

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

				// Une requête précédente ne doit pas écraser le résultat
				// d'une requête plus récente.
				if (requestId !== requestIdRef.current) return;

				setImages((current) =>
					reset ? result.data : [...current, ...result.data],
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
					loadingRef.current = false;
				}
			}
		},
		[filters, seed],
	);

	// Nouveau filtre = nouveau chargement depuis offset 0.
	useEffect(() => {
		offsetRef.current = 0;
		setImages([]);
		setHasMore(true);
		setOpenIndex(null);

		loadImages(true);
	}, [loadImages]);

	/*
	 * IntersectionObserver :
	 * quand le sentinel arrive dans le viewport, on charge la page suivante.
	 */
	// const loadMoreRef = useRef<HTMLDivElement | null>(null);

	// useEffect(() => {
	// 	const target = loadMoreRef.current;

	// 	if (!target || !hasMore) return;

	// 	const observer = new IntersectionObserver(
	// 		(entries) => {
	// 			if (entries[0]?.isIntersecting) {
	// 				loadImages(false);
	// 			}
	// 		},
	// 		{
	// 			rootMargin: "800px 0px",
	// 		},
	// 	);

	// 	observer.observe(target);

	// 	return () => observer.disconnect();
	// }, [hasMore, loadImages]);

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

	const results = images;

	const wallKey = useMemo(() => JSON.stringify(filters), [filters]);

	const columns = useMemo(() => {
		const result: Image[][] = Array.from({ length: 4 }, () => []);

		images.forEach((image, index) => {
			result[index % 4].push(image);
		});

		return result;
	}, [images]);

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
				) : results.length === 0 ? (
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
					<>
						<motion.ul
							key={wallKey}
							className="gallery-wall"
							variants={wallGroup}
							initial="hidden"
							animate="show"
							exit={{
								opacity: 0,
								transition: { duration: 0.2 },
							}}
						>
							{results.map((img, i) => {
								const ratio =
									img.width && img.height
										? img.width / img.height
										: undefined;

								return (
									<motion.li
										key={img.id}
										className="gallery-tile"
										variants={tile}
										style={
											ratio
												? {
														aspectRatio:
															String(ratio),
													}
												: undefined
										}
									>
										<button
											type="button"
											className="gallery-tile__button"
											onClick={() => setOpenIndex(i)}
											aria-label={`${img.title}${img.creator ? `, ${img.creator}` : ""}`}
										>
											<img
												src={img.image_url}
												alt=""
												loading={
													i < 6 ? "eager" : "lazy"
												}
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
									</motion.li>
								);
							})}
						</motion.ul>
						{/*<div
							ref={loadMoreRef}
							className="gallery-load-more"
							aria-hidden="true"
						>
							{loadingMore && <Loader size={32} />}
						</div>*/}
						{hasMore && (
							<div className="gallery-load-more">
								{loadingMore ? (
									<Loader size={32} />
								) : (
									<button
										type="button"
										onClick={() => loadImages(false)}
										className="gallery-load-more__button"
									>
										Charger plus
									</button>
								)}
							</div>
						)}
					</>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{openIndex !== null && results[openIndex] && (
					<ArtworkLightbox
						items={results}
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
