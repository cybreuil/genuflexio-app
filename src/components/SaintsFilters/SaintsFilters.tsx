import "./SaintsFilters.css";
import { AnimatePresence, motion } from "framer-motion";

import { useLanguage } from "../../hooks/useLanguage";

import { centuryLabel } from "../../utils/saintFormat";

export type SaintSort =
	| "random"
	| "name_asc"
	| "name_desc"
	| "century_asc"
	| "century_desc";

export type SaintsFiltersValue = {
	query: string;
	// TODO if needed: add support for 'unknown' century, request on century = null on api
	century: string; // "all" | "1".."21"
	sort: SaintSort;
};

export const DEFAULT_FILTERS: SaintsFiltersValue = {
	query: "",
	century: "all",
	sort: "random",
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
	resultCount?: number;
	debouncedQuery?: string;
};

const SaintsFilters = ({
	value,
	onChange,
	resultCount,
	debouncedQuery,
}: Props) => {
	const { t } = useLanguage();
	const isDirty =
		debouncedQuery !== DEFAULT_FILTERS.query ||
		value.century !== DEFAULT_FILTERS.century ||
		value.sort !== DEFAULT_FILTERS.sort;

	const saintSortOptions = getSaintSort(value.century, t);

	return (
		<form
			className="saints-filters"
			role="search"
			aria-label={t("saints.filters.label")}
			onSubmit={(e) => e.preventDefault()}
		>
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
				{" "}
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
					{/*<option value="unknown">
						{t("saints.filters.centuryUnknown")}
					</option>*/}
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

			<div className="saints-filters__end">
				{/*If loading, then resultcount is undefined
				 */}
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
		</form>
	);
};

export { SaintsFilters };
