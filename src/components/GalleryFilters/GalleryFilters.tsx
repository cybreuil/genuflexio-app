import "./GalleryFilters.css";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Facet } from "../../utils/artworkFormat";

export type GallerySort =
	| "random"
	| "title"
	| "artist"
	| "period_asc"
	| "period_desc";

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

type FacetKey = "artist" | "museum" | "century" | "saint";

const FACET_LABELS: Record<FacetKey, string> = {
	saint: "Saint",
	artist: "Artiste",
	century: "Siècle",
	museum: "Musée",
};

type Props = {
	value: GalleryFiltersValue;
	onChange: (next: GalleryFiltersValue) => void;
	facets: Record<FacetKey, Facet[]>;
	resultCount: number;
	totalCount: number;
};

const MAX_VISIBLE = 8;

function FacetRow({
	name,
	items,
	selected,
	onSelect,
}: {
	name: FacetKey;
	items: Facet[];
	selected: string | null;
	onSelect: (v: string | null) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	if (items.length === 0) return null;
	const visible = expanded ? items : items.slice(0, MAX_VISIBLE);
	const hidden = items.length - visible.length;

	return (
		<div className="gallery-facet">
			<span className="gallery-facet__label">{FACET_LABELS[name]}</span>
			<ul className="gallery-facet__chips">
				<li>
					<button
						type="button"
						className={`gallery-chip${selected === null ? " gallery-chip--active" : ""}`}
						onClick={() => onSelect(null)}
					>
						Tous
					</button>
				</li>
				{visible.map((f) => (
					<li key={f.value}>
						<button
							type="button"
							className={`gallery-chip${selected === f.value ? " gallery-chip--active" : ""}`}
							onClick={() =>
								onSelect(selected === f.value ? null : f.value)
							}
							aria-pressed={selected === f.value}
						>
							{f.label}
							<span className="gallery-chip__count">
								{f.count}
							</span>
						</button>
					</li>
				))}
				{hidden > 0 && (
					<li>
						<button
							type="button"
							className="gallery-chip gallery-chip--more"
							onClick={() => setExpanded(true)}
						>
							+{hidden}
						</button>
					</li>
				)}
				{expanded && items.length > MAX_VISIBLE && (
					<li>
						<button
							type="button"
							className="gallery-chip gallery-chip--more"
							onClick={() => setExpanded(false)}
						>
							Réduire
						</button>
					</li>
				)}
			</ul>
		</div>
	);
}

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
								name="saint"
								items={facets.saint}
								selected={value.saint}
								onSelect={(v) => set("saint", v)}
							/>
							<FacetRow
								name="artist"
								items={facets.artist}
								selected={value.artist}
								onSelect={(v) => set("artist", v)}
							/>
							<FacetRow
								name="century"
								items={facets.century}
								selected={value.century}
								onSelect={(v) => set("century", v)}
							/>
							<FacetRow
								name="museum"
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
