import "./SaintsPage.css";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { SaintCardSmall } from "../../components/SaintCardSmall/SaintCardSmall.tsx";
import { SaintModal } from "../../components/SaintModal/SaintModal.tsx";
import { Pagination } from "../../components/Pagination/Pagination.tsx";
import { Loader } from "../../components/Loader/Loader.tsx";
import {
	SaintsFilters,
	DEFAULT_FILTERS,
	type SaintsFiltersValue,
} from "../../components/SaintsFilters/SaintsFilters.tsx";

// Hooks
import { useSaints } from "../../hooks/useSaints.ts";
import { useLanguage } from "../../hooks/useLanguage.ts";

// Types
import type { SaintApi } from "../../types/Saint.ts";

/* ===== Animation presets ===== */

const EASE = [0.22, 1, 0.36, 1] as const;

const headerReveal = {
	hidden: { opacity: 0, y: 24 },
	show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const filtersReveal = {
	hidden: { opacity: 0 },
	show: { opacity: 1, transition: { duration: 3.8, ease: EASE } },
};

const gridGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06 } },
	exit: { opacity: 0, transition: { duration: 0.2 } },
};

const SAINTS_PER_PAGE = 12;

function StateBlock({
	tone = "neutral",
	children,
}: {
	tone?: "neutral" | "error";
	children: React.ReactNode;
}) {
	return (
		<motion.div
			className={`saints-state saints-state--${tone}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{children}
		</motion.div>
	);
}

export const SaintsPage = () => {
	const { languageCode } = useLanguage();

	const [filters, setFilters] = useState<SaintsFiltersValue>(DEFAULT_FILTERS);

	const [page, setPage] = useState(1);
	const [selectedSaint, setSelectedSaint] = useState<SaintApi | null>(null);

	const { century, sort } = filters;
	const {
		saints: saintsList,
		loading,
		error,
		totalCount,
		totalPages,
		debouncedQuery,
	} = useSaints({
		page,
		perPage: SAINTS_PER_PAGE,
		languageCode,
		q: filters.query,
		century,
		sort,
	});

	const handleFiltersChange = (next: SaintsFiltersValue) => {
		setFilters(next);
		setPage(1);
	};

	const handlePageChange = (nextPage: number) => {
		setPage(nextPage);
		const reduceMotion = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches;
		window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
	};

	const gridKey = `${page}-${debouncedQuery}-${century}-${sort}`;

	// For layout disabling during grid rearrangement
	// const [layoutGridKey, setLayoutGridKey] = useState(gridKey);
	// const isNewGrid = layoutGridKey !== gridKey;

	return (
		<div className="saints-page">
			<motion.header
				className="saints-header"
				variants={headerReveal}
				initial="hidden"
				animate="show"
			>
				<span className="saints-header__eyebrow">─ Art & mémoire</span>
				<h1 className="saints-header__title">Les vies des saints</h1>
				<p className="saints-header__text">
					Des centaines de figures, leurs histoires et les
					chefs-d'œuvre qu'elles ont inspirés. Parcourez la galerie,
					siècle après siècle.
				</p>
				{totalPages > 1 && (
					<p className="saints-header__meta">
						Page {page} / {totalPages}
					</p>
				)}
			</motion.header>

			<motion.div
				className="saints-toolbar"
				variants={filtersReveal}
				initial="hidden"
				animate="show"
			>
				<SaintsFilters
					value={filters}
					debouncedQuery={debouncedQuery}
					onChange={handleFiltersChange}
					// Let's not use loading: to avoid glitching
					// resultCount={loading ? undefined : totalCount}
					resultCount={totalCount}
				/>
			</motion.div>

			<AnimatePresence mode="wait">
				{loading ? (
					<StateBlock key="loading">
						<Loader size={56} />
					</StateBlock>
				) : error ? (
					<StateBlock key="error" tone="error">
						Impossible de charger les saints.
						<span className="saints-state__detail">
							{error.message}
						</span>
					</StateBlock>
				) : saintsList.length === 0 ? (
					<StateBlock key="empty">
						Aucun saint ne correspond à cette recherche.
					</StateBlock>
				) : (
					<motion.section
						key={gridKey}
						className="saints-grid"
						variants={gridGroup}
						initial="hidden"
						animate="show"
						exit="exit"
						aria-label="Liste des saints"
						// onAnimationComplete={() => setLayoutGridKey(gridKey)}
					>
						{saintsList.map((saint, index) => (
							<SaintCardSmall
								key={saint.id}
								// enableLayoutId={!isNewGrid}
								saint={saint}
								// onClick={() => setSelectedSaint(saint)}
								index={index}
							/>
						))}
					</motion.section>
				)}
			</AnimatePresence>

			{/*We use layoutId on the modal and the card, so AnimatePresence is not needed here.
				It would cause a flicker when opening/closing the modal.*/}

			{/*<AnimatePresence>*/}
			{selectedSaint && (
				<SaintModal
					saint={selectedSaint}
					onClose={() => setSelectedSaint(null)}
				/>
			)}
			{/*</AnimatePresence>*/}

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};
