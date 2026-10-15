import "./AdminPage.css";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { Loader } from "../../components/Loader/Loader";
import { Pagination } from "../../components/Pagination/Pagination";

// Hooks
import { useVisitStats, useVisits } from "../../hooks/useAnalytics";
import { useLanguage } from "../../hooks/useLanguage";

// Types
import type {
	LabelledCount,
	VisitStats,
	VisitsRange,
} from "../../types/Analytics";

/* ===== Animation presets ===== */

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
	hidden: { opacity: 0, y: 24 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const stagger = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08 } },
};

const RANGES: { value: VisitsRange; label: string }[] = [
	{ value: "7d", label: "7 jours" },
	{ value: "30d", label: "30 jours" },
	{ value: "90d", label: "90 jours" },
	{ value: "all", label: "Tout" },
];

const VISITS_PER_PAGE = 25;

/* ===== Helpers ===== */

const numberFormat = new Intl.NumberFormat("fr-FR");
const fmt = (n: number) => numberFormat.format(n);
const pct = (ratio: number) => `${Math.round(ratio * 100)} %`;

/** "FR" → 🇫🇷 via les regional indicator symbols. */
function flagEmoji(code: string | null): string {
	if (!code || code.length !== 2) return "🏳️";
	return String.fromCodePoint(
		...code
			.toUpperCase()
			.split("")
			.map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
	);
}

function deltaLabel(today: number, yesterday: number) {
	if (yesterday === 0) return today > 0 ? "nouveau" : "—";
	const diff = Math.round(((today - yesterday) / yesterday) * 100);
	return `${diff > 0 ? "+" : ""}${diff} % vs hier`;
}

/* ===== Small presentational pieces ===== */

function StateBlock({
	tone = "neutral",
	children,
}: {
	tone?: "neutral" | "error";
	children: React.ReactNode;
}) {
	return (
		<motion.div
			className={`admin-state admin-state--${tone}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{children}
		</motion.div>
	);
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<div className="admin-section__head">
			<span className="admin-eyebrow">{eyebrow}</span>
			<h2 className="admin-section__title">{title}</h2>
		</div>
	);
}

/** Liste "label — barre — valeur" pour les tops. */
function RankedList({
	title,
	items,
	renderLabel,
	empty = "Aucune donnée",
}: {
	title: string;
	items: LabelledCount[];
	renderLabel?: (item: LabelledCount) => React.ReactNode;
	empty?: string;
}) {
	const max = items[0]?.count ?? 0;
	return (
		<motion.article className="admin-card" variants={reveal}>
			<h3 className="admin-card__title">{title}</h3>
			{items.length === 0 ? (
				<p className="admin-card__empty">{empty}</p>
			) : (
				<ol className="admin-ranked">
					{items.map((item) => (
						<li className="admin-ranked__row" key={item.label}>
							<span className="admin-ranked__label">
								{renderLabel ? renderLabel(item) : item.label}
							</span>
							<span
								className="admin-ranked__bar"
								aria-hidden="true"
							>
								<span
									className="admin-ranked__fill"
									style={{
										width: `${max ? (item.count / max) * 100 : 0}%`,
									}}
								/>
							</span>
							<span className="admin-ranked__count">
								{fmt(item.count)}
							</span>
						</li>
					))}
				</ol>
			)}
		</motion.article>
	);
}

/** Courbe SVG minimaliste des visites par jour, sans dépendance. */
function DailyChart({ daily }: { daily: VisitStats["daily"] }) {
	const chart = useMemo(() => {
		const W = 600;
		const H = 160;
		const PAD = 6;
		if (daily.length === 0) return null;

		const max = Math.max(1, ...daily.map((d) => d.visits));
		const step =
			daily.length > 1 ? (W - PAD * 2) / (daily.length - 1) : 0;
		const points = daily.map((d, i) => {
			const x = PAD + i * step;
			const y = H - PAD - (d.visits / max) * (H - PAD * 2);
			return [x, y] as const;
		});
		const line = points
			.map(
				([x, y], i) =>
					`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
			)
			.join(" ");
		const lastX = points[points.length - 1][0].toFixed(1);
		const area = `${line} L${lastX},${H - PAD} L${PAD},${H - PAD} Z`;

		return {
			line,
			area,
			max,
			first: daily[0].date,
			last: daily[daily.length - 1].date,
		};
	}, [daily]);

	if (!chart) {
		return <p className="admin-card__empty">Pas encore de données.</p>;
	}

	return (
		<div className="admin-chart">
			<svg
				className="admin-chart__svg"
				viewBox="0 0 600 160"
				preserveAspectRatio="none"
				role="img"
				aria-label="Visites par jour"
			>
				<path className="admin-chart__area" d={chart.area} />
				<path className="admin-chart__line" d={chart.line} />
			</svg>
			<div className="admin-chart__axis">
				<span>{chart.first}</span>
				<span className="admin-chart__max">
					pic : {fmt(chart.max)} / jour
				</span>
				<span>{chart.last}</span>
			</div>
		</div>
	);
}

/* ===== Page ===== */

const AdminPage = () => {
	const { languageCode } = useLanguage();
	const [range, setRange] = useState<VisitsRange>("30d");
	const [page, setPage] = useState(1);

	const {
		stats,
		loading: statsLoading,
		error: statsError,
	} = useVisitStats(range);
	const {
		visits,
		total,
		totalPages,
		loading: visitsLoading,
		error: visitsError,
	} = useVisits({ page, perPage: VISITS_PER_PAGE, range });

	const dateTime = useMemo(
		() =>
			new Intl.DateTimeFormat(languageCode, {
				day: "2-digit",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
			}),
		[languageCode],
	);

	const handleRangeChange = (next: VisitsRange) => {
		setRange(next);
		setPage(1);
	};

	const handlePageChange = (nextPage: number) => {
		setPage(nextPage);
		document
			.getElementById("admin-visits")
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const kpis = stats
		? [
				{
					label: "Visites",
					value: fmt(stats.total_visits),
					note: RANGES.find((r) => r.value === range)?.label,
				},
				{
					label: "Visiteurs uniques",
					value: fmt(stats.unique_visitors),
					note: `${pct(stats.new_visitors_ratio)} de nouveaux`,
				},
				{
					label: "Aujourd'hui",
					value: fmt(stats.visits_today),
					note: deltaLabel(
						stats.visits_today,
						stats.visits_yesterday,
					),
				},
				{
					label: "Pays",
					value: fmt(stats.countries_count),
					note: stats.top_countries[0]
						? `${flagEmoji(stats.top_countries[0].country_code)} ${stats.top_countries[0].country_name} en tête`
						: undefined,
				},
			]
		: [];

	return (
		<div className="admin-page">
			{/* ===== Header ===== */}
			<motion.header
				className="admin-header"
				variants={reveal}
				initial="hidden"
				animate="show"
			>
				<span className="admin-eyebrow">─ Administration</span>
				<h1 className="admin-header__title">Fréquentation</h1>
				<p className="admin-header__text">
					Une visite est comptée au premier chargement du site, une
					fois par session. Les données sont enrichies côté serveur
					(pays, navigateur, appareil).
				</p>

				<div
					className="admin-ranges"
					role="radiogroup"
					aria-label="Période"
				>
					{RANGES.map((r) => (
						<button
							key={r.value}
							type="button"
							role="radio"
							aria-checked={range === r.value}
							className={`admin-range${
								range === r.value ? " admin-range--active" : ""
							}`}
							onClick={() => handleRangeChange(r.value)}
						>
							{r.label}
						</button>
					))}
				</div>
			</motion.header>

			{/* ===== Stats ===== */}
			<AnimatePresence mode="wait">
				{statsLoading ? (
					<StateBlock key="stats-loading">
						<Loader size={56} />
					</StateBlock>
				) : statsError || !stats ? (
					<StateBlock key="stats-error" tone="error">
						Impossible de charger les statistiques.
						<span className="admin-state__detail">
							{statsError?.message}
						</span>
					</StateBlock>
				) : (
					<motion.div
						key={`stats-${range}`}
						variants={stagger}
						initial="hidden"
						animate="show"
						exit={{ opacity: 0, transition: { duration: 0.2 } }}
						className="admin-stats"
					>
						{/* --- KPIs --- */}
						<motion.section
							className="admin-numbers"
							variants={stagger}
							aria-label="Chiffres clés"
						>
							{kpis.map((kpi) => (
								<motion.div
									key={kpi.label}
									className="admin-number"
									variants={reveal}
								>
									<span className="admin-number__label">
										{kpi.label}
									</span>
									<span className="admin-number__value">
										{kpi.value}
									</span>
									{kpi.note && (
										<span className="admin-number__note">
											{kpi.note}
										</span>
									)}
								</motion.div>
							))}
						</motion.section>

						{/* --- Courbe --- */}
						<motion.section
							className="admin-section"
							variants={reveal}
						>
							<SectionHead
								eyebrow="─ Tendance"
								title="Visites par jour"
							/>
							<div className="admin-card admin-card--wide">
								<DailyChart daily={stats.daily} />
							</div>
						</motion.section>

						{/* --- Tops --- */}
						<motion.section
							className="admin-section"
							variants={reveal}
						>
							<SectionHead
								eyebrow="─ Répartition"
								title="D'où viennent-ils ?"
							/>
							<motion.div
								className="admin-grid"
								variants={stagger}
							>
								<RankedList
									title="Pays"
									items={stats.top_countries.map((c) => ({
										label: c.country_code,
										count: c.count,
									}))}
									renderLabel={(item) => {
										const c = stats.top_countries.find(
											(x) =>
												x.country_code === item.label,
										);
										return (
											<>
												<span className="admin-flag">
													{flagEmoji(item.label)}
												</span>
												{c?.country_name ?? item.label}
											</>
										);
									}}
								/>
								<RankedList
									title="Appareils"
									items={stats.top_devices}
								/>
								<RankedList
									title="Navigateurs"
									items={stats.top_browsers}
								/>
								<RankedList
									title="Provenance"
									items={stats.top_referrers}
									renderLabel={(item) =>
										item.label || "Accès direct"
									}
								/>
								<RankedList
									title="Langues"
									items={stats.top_languages}
								/>
								<RankedList
									title="Pages d'entrée"
									items={stats.top_paths}
									renderLabel={(item) => (
										<code className="admin-code">
											{item.label}
										</code>
									)}
								/>
							</motion.div>
						</motion.section>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ===== Journal des visites ===== */}
			<section className="admin-section" id="admin-visits">
				<div className="admin-section__head admin-section__head--row">
					<div>
						<span className="admin-eyebrow">─ Journal</span>
						<h2 className="admin-section__title">
							Dernières visites
						</h2>
					</div>
					{!visitsLoading && !visitsError && (
						<p className="admin-section__meta">
							{fmt(total)} visite{total > 1 ? "s" : ""}
							{totalPages > 1 &&
								` · page ${page} / ${totalPages}`}
						</p>
					)}
				</div>

				<AnimatePresence mode="wait">
					{visitsLoading ? (
						<StateBlock key="visits-loading">
							<Loader size={48} />
						</StateBlock>
					) : visitsError ? (
						<StateBlock key="visits-error" tone="error">
							Impossible de charger le journal.
							<span className="admin-state__detail">
								{visitsError.message}
							</span>
						</StateBlock>
					) : visits.length === 0 ? (
						<StateBlock key="visits-empty">
							Aucune visite sur cette période.
						</StateBlock>
					) : (
						<motion.div
							key={`visits-${range}-${page}`}
							className="admin-card admin-card--wide admin-table-wrap"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.35, ease: EASE }}
						>
							<table className="admin-table">
								<thead>
									<tr>
										<th>Date</th>
										<th>Pays</th>
										<th>IP</th>
										<th>Appareil</th>
										<th>Page d'entrée</th>
										<th>Provenance</th>
									</tr>
								</thead>
								<tbody>
									{visits.map((v) => (
										<tr key={v.id}>
											<td className="admin-table__nowrap">
												<time dateTime={v.visited_at}>
													{dateTime.format(
														new Date(v.visited_at),
													)}
												</time>
											</td>
											<td className="admin-table__nowrap">
												<span className="admin-flag">
													{flagEmoji(v.country_code)}
												</span>
												{v.country_name ?? "Inconnu"}
												{v.city && (
													<span className="admin-table__muted">
														{" "}
														· {v.city}
													</span>
												)}
											</td>
											<td className="admin-table__nowrap">
												<code className="admin-code">
													{v.ip}
												</code>
												{v.is_new_visitor && (
													<span className="admin-badge">
														nouveau
													</span>
												)}
											</td>
											<td className="admin-table__nowrap">
												{v.device}
												{(v.browser || v.os) && (
													<span className="admin-table__muted">
														{" "}
														·{" "}
														{[v.browser, v.os]
															.filter(Boolean)
															.join(" / ")}
													</span>
												)}
											</td>
											<td>
												<code className="admin-code">
													{v.path}
												</code>
											</td>
											<td className="admin-table__referrer">
												{v.referrer || (
													<span className="admin-table__muted">
														direct
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</motion.div>
					)}
				</AnimatePresence>

				<Pagination
					currentPage={page}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
			</section>
		</div>
	);
};

export { AdminPage };
