import "./GalleryFilters.css";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FacetMap } from "../../types/Facet";
import type { GalleryFacetKey } from "../../types/Image";
import { FacetRow } from "../FacetRow/FacetRow";
import { centuryLabel } from "../../utils/saintFormat";
import { useLanguage } from "../../hooks/useLanguage";

export type GallerySort =
	"random" | "title" | "artist" | "period_asc" | "period_desc";

export type GalleryFiltersValue = {
	query: string;
	artist: string | null;
	museum: string | null;
	century: number | null;
	saint: string | null;
	sort: GallerySort;
};

export const DEFAULT_GALLERY_FILTERS: GalleryFiltersValue = {
	query: "",
	artist: null,
	museum: null,
	century: null,
	saint: null,
	sort: "random",
};

const getSortOptions = (t: (key: string) => string) => [
	{ value: "random", label: t("galleryPage.sortOptions.sortRandom") },
	{ value: "period_asc", label: t("galleryPage.sortOptions.sortPeriodAsc") },
	{
		value: "period_desc",
		label: t("galleryPage.sortOptions.sortPeriodDesc"),
	},
	{ value: "artist", label: t("galleryPage.sortOptions.sortArtist") },
	{ value: "title", label: t("galleryPage.sortOptions.sortTitle") },
];

const getFacetLabels = (t: (key: string) => string) => ({
	saint: t("galleryPage.facetKeys.saint"),
	artist: t("galleryPage.facetKeys.artist"),
	century: t("galleryPage.facetKeys.century"),
	museum: t("galleryPage.facetKeys.museum"),
});

type FacetKey = GalleryFacetKey;

// const FACET_LABELS: Record<FacetKey, string> = {
// 	saint: "Saint",
// 	artist: "Artiste",
// 	century: "Siècle",
// 	museum: "Musée",
// };

type Props = {
	value: GalleryFiltersValue;
	onChange: (next: GalleryFiltersValue) => void;
	facets: FacetMap<FacetKey>;
	resultCount: number;
	totalCount: number;
};

const GalleryFilters = ({
	value,
	onChange,
	facets,
	resultCount,
	totalCount,
}: Props) => {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);

	const activeCount = [
		value.artist,
		value.museum,
		value.century,
		value.saint,
	].filter(Boolean).length;
	const isDirty =
		activeCount > 0 || value.query !== "" || value.sort !== "random";

	const set = <K extends keyof GalleryFiltersValue>(
		key: K,
		v: GalleryFiltersValue[K],
	) => onChange({ ...value, [key]: v });

	const sortOptions = getSortOptions(t);
	const facetLabels = getFacetLabels(t);

	return (
		<div className="gallery-filters">
			<div className="gallery-filters__bar">
				<input
					aria-label={t("galleryPage.filters.search")}
					placeholder={t("galleryPage.filters.searchPlaceholder")}
					className="gallery-filters__search"
					type="search"
					value={value.query}
					onChange={(e) => set("query", e.target.value)}
					autoComplete="off"
				/>

				<button
					type="button"
					className={`gallery-filters__toggle${open ? " gallery-filters__toggle--open" : ""}`}
					onClick={() => setOpen((o) => !o)}
					aria-expanded={open}
				>
					{t("galleryPage.filters.filters")}
					{activeCount > 0 && (
						<span className="gallery-filters__badge">
							{activeCount}
						</span>
					)}
				</button>

				<select
					aria-label={t("galleryPage.filters.sort")}
					className="gallery-filters__sort"
					value={value.sort}
					onChange={(e) => set("sort", e.target.value as GallerySort)}
				>
					{sortOptions.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<span className="gallery-filters__count" aria-live="polite">
					{resultCount === totalCount
						? `${totalCount} ${totalCount > 1 ? t("galleryPage.filters.artworks") : t("galleryPage.filters.artwork")}`
						: `${resultCount} / ${totalCount} ${t("galleryPage.filters.artworks")}`}
				</span>

				{isDirty && (
					<button
						type="button"
						className="gallery-filters__reset"
						onClick={() => onChange(DEFAULT_GALLERY_FILTERS)}
					>
						{t("galleryPage.filters.reset")}
					</button>
				)}
			</div>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						className="gallery-filters__panel"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{
							duration: 0.35,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<div className="gallery-filters__panel-inner">
							<FacetRow
								label={facetLabels.saint}
								allLabel={t("galleryPage.filters.all")}
								lessLabel={t("galleryPage.filters.less")}
								items={facets.saint}
								selected={value.saint}
								onSelect={(v) => set("saint", v)}
							/>
							<FacetRow
								label={facetLabels.artist}
								allLabel={t("galleryPage.filters.all")}
								lessLabel={t("galleryPage.filters.less")}
								items={facets.artist}
								selected={value.artist}
								onSelect={(v) => set("artist", v)}
							/>
							<FacetRow
								label={facetLabels.century}
								allLabel={t("galleryPage.filters.all")}
								lessLabel={t("galleryPage.filters.less")}
								items={facets.century}
								formatLabel={(f) =>
									centuryLabel(Number(f.value), t) ?? f.label
								}
								selected={
									value.century !== null
										? String(value.century)
										: null
								}
								onSelect={(v) =>
									set(
										"century",
										v !== null ? Number(v) : null,
									)
								}
							/>
							<FacetRow
								label={facetLabels.museum}
								allLabel={t("galleryPage.filters.all")}
								lessLabel={t("galleryPage.filters.less")}
								items={facets.museum}
								selected={value.museum}
								onSelect={(v) => set("museum", v)}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export { GalleryFilters };
