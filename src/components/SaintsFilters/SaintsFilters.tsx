import "./SaintsFilters.css";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useLanguage } from "../../hooks/useLanguage";
import { FacetRow } from "../FacetRow/FacetRow";
import type { FacetMap } from "../../types/Facet";
import type { SaintFacetKey } from "../../types/Saint";

import { centuryLabel } from "../../utils/saintFormat";

export type SaintSort =
	"random" | "name_asc" | "name_desc" | "century_asc" | "century_desc";

export type SaintsFiltersValue = {
	query: string;
	// TODO if needed: add support for 'unknown' century, request on century = null on api
	century: string; // "all" | "1".."21"
	sort: SaintSort;
	/** Attribute codes (title / order / symbol). All must match. */
	attributes: string[];
	/** Patronage codes. All must match. */
	patronages: string[];
};

export const DEFAULT_FILTERS: SaintsFiltersValue = {
	query: "",
	century: "all",
	sort: "random",
	attributes: [],
	patronages: [],
};

const CENTURIES = Array.from({ length: 21 }, (_, i) => i + 1);

const getSaintSort = (century: string, t: (key: string) => string) => [
	{ value: "random", label: t("saints.filters.sortRandom") },
	{ value: "name_asc", label: t("saints.filters.sortNameAsc") },
	{ value: "name_desc", label: t("saints.filters.sortNameDesc") },
	{
		value: "century_asc",
		label: t("saints.filters.sortCenturyAsc"),
		disabled: century !== "all",
	},
	{
		value: "century_desc",
		label: t("saints.filters.sortCenturyDesc"),
		disabled: century !== "all",
	},
];

type Props = {
	value: SaintsFiltersValue;
	onChange: (next: SaintsFiltersValue) => void;
	facets: FacetMap<SaintFacetKey>;
	resultCount?: number;
	debouncedQuery?: string;
};

const SaintsFilters = ({
	value,
	onChange,
	facets,
	resultCount,
	debouncedQuery,
}: Props) => {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);

	const activeCount = value.attributes.length + value.patronages.length;
	const isDirty =
		debouncedQuery !== DEFAULT_FILTERS.query ||
		value.century !== DEFAULT_FILTERS.century ||
		value.sort !== DEFAULT_FILTERS.sort ||
		activeCount > 0;

	const saintSortOptions = getSaintSort(value.century, t);

	// Attributes share one array on the API side; each row only owns the codes
	// belonging to its own facet so toggling a title never drops an order.
	const setAttributeGroup =
		(group: "title" | "order" | "symbol") => (next: string[]) => {
			const groupCodes = new Set(
				(facets[group] ?? []).map((f) => f.value),
			);
			const others = value.attributes.filter((c) => !groupCodes.has(c));
			onChange({ ...value, attributes: [...others, ...next] });
		};

	const selectedIn = (group: "title" | "order" | "symbol") => {
		const groupCodes = new Set((facets[group] ?? []).map((f) => f.value));
		return value.attributes.filter((c) => groupCodes.has(c));
	};

	const hasFacets =
		(facets.title?.length ?? 0) +
			(facets.order?.length ?? 0) +
			(facets.symbol?.length ?? 0) +
			(facets.patronage?.length ?? 0) >
		0;

	return (
		<form
			className="saints-filters"
			role="search"
			aria-label={t("saints.filters.label")}
			onSubmit={(e) => e.preventDefault()}
		>
			<div className="saints-filters__bar">
				<motion.label
					className="saints-filters__field saints-filters__field--grow"
					layout="x"
				>
					<span className="saints-filters__label">
						{t("saints.filters.search")}
					</span>
					<input
						type="search"
						placeholder={t("saints.filters.searchPlaceholder")}
						value={value.query}
						onChange={(e) =>
							onChange({ ...value, query: e.target.value })
						}
						autoComplete="off"
					/>
				</motion.label>

				<motion.label className="saints-filters__field" layout="x">
					<span className="saints-filters__label">
						{t("saints.filters.century")}
					</span>
					<select
						value={value.century}
						onChange={(e) => {
							const century = e.target.value;

							const sort =
								century !== "all" ? "name_asc" : value.sort;

							onChange({
								...value,
								century,
								sort,
							});
						}}
					>
						<option value="all">
							{t("saints.filters.centuryAll")}
						</option>
						{CENTURIES.map((c) => (
							<option key={c} value={c}>
								{centuryLabel(c, t) ?? c}
							</option>
						))}
					</select>
				</motion.label>

				<motion.label className="saints-filters__field" layout="x">
					<span className="saints-filters__label">
						{t("saints.filters.sort")}
					</span>
					<select
						value={value.sort}
						onChange={(e) =>
							onChange({
								...value,
								sort: e.target.value as SaintSort,
							})
						}
					>
						{saintSortOptions.map((o) => (
							<option
								key={o.value}
								value={o.value}
								disabled={o.disabled}
							>
								{o.label}
							</option>
						))}
					</select>
				</motion.label>

				{hasFacets && (
					<motion.div className="saints-filters__field" layout="x">
						<span className="saints-filters__label" aria-hidden>
							&nbsp;
						</span>
						<button
							type="button"
							className={`saints-filters__toggle${open ? " saints-filters__toggle--open" : ""}`}
							onClick={() => setOpen((o) => !o)}
							aria-expanded={open}
						>
							{t("saints.filters.filters")}
							{activeCount > 0 && (
								<span className="saints-filters__badge">
									{activeCount}
								</span>
							)}
						</button>
					</motion.div>
				)}

				<div className="saints-filters__end">
					{typeof resultCount === "number" ? (
						<motion.span
							className="saints-filters__count"
							aria-live="polite"
							layout="x"
						>
							{resultCount}{" "}
							{resultCount > 1
								? t("saints.filters.results")
								: t("saints.filters.result")}
						</motion.span>
					) : (
						<motion.span
							className="saints-filters__count"
							aria-live="polite"
							layout="x"
						>
							loading ...
						</motion.span>
					)}
					<AnimatePresence mode="popLayout">
						{isDirty && (
							<motion.button
								type="button"
								className="saints-filters__reset"
								onClick={() => onChange(DEFAULT_FILTERS)}
								initial={{
									opacity: 0,
									scale: 0.5,
								}}
								animate={{
									opacity: 1,
									scale: 1,
									transition: { duration: 0.6 },
								}}
								exit={{ opacity: 0, scale: 0.5 }}
								layout="x"
							>
								{t("saints.filters.reset")}
							</motion.button>
						)}
					</AnimatePresence>
				</div>
			</div>

			<AnimatePresence initial={false}>
				{open && hasFacets && (
					<motion.div
						className="saints-filters__panel"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{
							duration: 0.35,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<div className="saints-filters__panel-inner">
							<FacetRow
								mode="multi"
								label={t("saint.titles")}
								allLabel={t("saints.filters.centuryAll")}
								lessLabel={t("saints.filters.less")}
								items={facets.title}
								selected={selectedIn("title")}
								onSelect={setAttributeGroup("title")}
							/>
							<FacetRow
								mode="multi"
								label={t("saint.orders")}
								allLabel={t("saints.filters.centuryAll")}
								lessLabel={t("saints.filters.less")}
								items={facets.order}
								selected={selectedIn("order")}
								onSelect={setAttributeGroup("order")}
							/>
							<FacetRow
								mode="multi"
								label={t("saint.symbols")}
								allLabel={t("saints.filters.centuryAll")}
								lessLabel={t("saints.filters.less")}
								items={facets.symbol}
								selected={selectedIn("symbol")}
								onSelect={setAttributeGroup("symbol")}
							/>
							<FacetRow
								mode="multi"
								label={t("saint.patronages")}
								allLabel={t("saints.filters.centuryAll")}
								lessLabel={t("saints.filters.less")}
								items={facets.patronage}
								selected={value.patronages}
								onSelect={(patronages) =>
									onChange({ ...value, patronages })
								}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</form>
	);
};

export { SaintsFilters };
