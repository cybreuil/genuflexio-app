import "./GalleryFilters.css";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FacetMap } from "../../types/Facet";
import type { GalleryFacetKey } from "../../types/Image";
import { FacetRow } from "../FacetRow/FacetRow";
import { periodLabel } from "../../utils/artworkFormat";

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

const SORT_OPTIONS: { value: GallerySort; label: string }[] = [
	{ value: "random", label: "Accrochage libre" },
	{ value: "period_asc", label: "Du plus ancien" },
	{ value: "period_desc", label: "Du plus récent" },
	{ value: "artist", label: "Par artiste" },
	{ value: "title", label: "Par titre" },
];

type FacetKey = GalleryFacetKey;

const FACET_LABELS: Record<FacetKey, string> = {
	saint: "Saint",
	artist: "Artiste",
	century: "Siècle",
	museum: "Musée",
};

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

	return (
		<div className="gallery-filters">
			<div className="gallery-filters__bar">
				<label className="gallery-filters__search">
					<span className="sr-only">Rechercher une œuvre</span>
					<input
						type="search"
						placeholder="Titre, artiste, saint…"
						value={value.query}
						onChange={(e) => set("query", e.target.value)}
						autoComplete="off"
					/>
				</label>

				<button
					type="button"
					className={`gallery-filters__toggle${open ? " gallery-filters__toggle--open" : ""}`}
					onClick={() => setOpen((o) => !o)}
					aria-expanded={open}
				>
					Filtres
					{activeCount > 0 && (
						<span className="gallery-filters__badge">
							{activeCount}
						</span>
					)}
				</button>

				<label className="gallery-filters__sort">
					<span className="sr-only">Trier</span>
					<select
						value={value.sort}
						onChange={(e) =>
							set("sort", e.target.value as GallerySort)
						}
					>
						{SORT_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</label>

				<span className="gallery-filters__count" aria-live="polite">
					{resultCount === totalCount
						? `${totalCount} œuvres`
						: `${resultCount} / ${totalCount} œuvres`}
				</span>

				{isDirty && (
					<button
						type="button"
						className="gallery-filters__reset"
						onClick={() => onChange(DEFAULT_GALLERY_FILTERS)}
					>
						Réinitialiser
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
								label={FACET_LABELS.saint}
								allLabel="Tous"
								lessLabel="Réduire"
								items={facets.saint}
								selected={value.saint}
								onSelect={(v) => set("saint", v)}
							/>
							<FacetRow
								label={FACET_LABELS.artist}
								allLabel="Tous"
								lessLabel="Réduire"
								items={facets.artist}
								selected={value.artist}
								onSelect={(v) => set("artist", v)}
							/>
							<FacetRow
								label={FACET_LABELS.century}
								allLabel="Tous"
								lessLabel="Réduire"
								items={facets.century}
								formatLabel={(f) => periodLabel(f.value)}
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
								label={FACET_LABELS.museum}
								allLabel="Tous"
								lessLabel="Réduire"
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
