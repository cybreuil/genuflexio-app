import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import "./SaintModal.css";
import { TRANSITIONS } from "../../styles/theme";
import { RippleLink } from "../RippleLink/RippleLink";
import type { SaintApi } from "../../types/Saint";
import { useSaintBySlug } from "../../hooks/useSaints";
import { useLanguage } from "../../hooks/useLanguage";
import {
	centuryLabel,
	formatPartialDate,
	primaryImage,
	toRoman,
} from "../../utils/saintFormat";

const EASE = [0.22, 1, 0.36, 1] as const;

const bodyGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const rise = {
	hidden: { opacity: 0, y: 18 },
	show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const exitFade = { opacity: 0, transition: { duration: 0.15 } };

const MAX_PATRONAGES = 6;

export function SaintModal({
	saint,
	onClose,
}: {
	saint: SaintApi;
	onClose: () => void;
}) {
	const { languageCode, t } = useLanguage();

	const { detail, loading, error } = useSaintBySlug(saint.slug, languageCode);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	const imageUrl =
		saint.image_url || primaryImage(detail?.images)?.image_url || null;
	const name = detail?.name || saint.name || saint.default_name;
	const century = detail?.century ?? saint.century ?? null;
	const eyebrow = saint.life_label || centuryLabel(century, t) || null;
	const titleId = `saint-modal-title-${saint.id}`;

	const patronages = detail?.patronages ?? [];
	const shownPatronages = patronages.slice(0, MAX_PATRONAGES);
	const hiddenPatronages = patronages.length - shownPatronages.length;

	return createPortal(
		<>
			{/* AnimatePresence est géré ici, on laisse la modale avec layoutid */}

			<motion.div
				className="saint-modal__backdrop"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				transition={TRANSITIONS.normal}
			/>

			<motion.div
				className="saint-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				layoutId={`saint-${saint.id}`}
				transition={TRANSITIONS.normal}
			>
				{/* --- Cover --- */}
				<header
					className={`saint-modal__cover${
						imageUrl ? "" : " saint-modal__cover--no-image"
					}`}
				>
					{imageUrl && (
						<img
							className="saint-modal__cover-image"
							src={imageUrl}
							alt={name}
							decoding="async"
						/>
					)}
					<div className="saint-modal__shade" aria-hidden="true" />

					<motion.button
						type="button"
						className="saint-modal__close"
						onClick={onClose}
						aria-label="Fermer"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={exitFade}
						transition={{ ...TRANSITIONS.normal, delay: 0.1 }}
					>
						×
					</motion.button>

					<div className="saint-modal__cover-text">
						{eyebrow && (
							<motion.span
								className="saint-modal__eyebrow"
								// initial={{ opacity: 0, y: 10 }}
								// animate={{ opacity: 1, y: 0 }}
								// exit={exitFade}
								// transition={{
								// 	duration: 0.5,
								// 	ease: EASE,
								// 	delay: 0.15,
								// }}
								layoutId={`saint-eyebrow-${saint.id}`}
							>
								{eyebrow}
							</motion.span>
						)}
						<motion.h2
							id={titleId}
							className="saint-modal__title"
							layoutId={`saint-name-${saint.id}`}
							transition={TRANSITIONS.normal}
						>
							{name}
						</motion.h2>
					</div>
				</header>

				{/* --- Corps (aperçu) --- */}
				<motion.div
					className="saint-modal__body"
					variants={bodyGroup}
					initial="hidden"
					animate="show"
					exit={exitFade}
				>
					<motion.dl className="saint-modal__facts" variants={rise}>
						<div className="saint-fact">
							<dt>Naissance</dt>
							<dd>
								{formatPartialDate(
									{
										year: detail?.birth_year,
										month: detail?.birth_month,
										day: detail?.birth_day,
										approximate:
											detail?.birth_is_approximate,
									},
									languageCode,
								)}
							</dd>
						</div>
						<div className="saint-fact">
							<dt>Mort</dt>
							<dd>
								{formatPartialDate(
									{
										year: detail?.death_year,
										month: detail?.death_month,
										day: detail?.death_day,
										approximate:
											detail?.death_is_approximate,
									},
									languageCode,
								)}
							</dd>
						</div>
						<div className="saint-fact">
							<dt>Siècle</dt>
							<dd>{century != null ? toRoman(century) : "—"}</dd>
						</div>
					</motion.dl>

					<motion.div className="saint-modal__prose" variants={rise}>
						{loading ? (
							<div
								className="saint-modal__skeleton"
								aria-busy="true"
							>
								<span />
								<span />
								<span />
							</div>
						) : error ? (
							<p className="saint-modal__error">
								{error.message}
							</p>
						) : detail?.short_description ? (
							<p className="saint-modal__lead">
								{detail.short_description}
							</p>
						) : (
							<p className="saint-modal__empty">
								Aucune description disponible pour le moment.
							</p>
						)}
					</motion.div>

					{shownPatronages.length > 0 && (
						<motion.section
							className="saint-modal__patronages"
							variants={rise}
						>
							<h3 className="saint-modal__eyebrow-title">
								Patronages
							</h3>
							<ul className="saint-modal__tags">
								{shownPatronages.map((p) => (
									<li
										key={p.code}
										className="saint-tag"
										title={p.description}
									>
										{p.label}
									</li>
								))}
								{hiddenPatronages > 0 && (
									<li className="saint-tag saint-tag--more">
										+{hiddenPatronages}
									</li>
								)}
							</ul>
						</motion.section>
					)}

					<motion.footer
						className="saint-modal__footer"
						variants={rise}
					>
						<RippleLink
							to={`/saints/${saint.slug}`}
							className="saint-modal__cta"
							rippleColor="rgba(0, 0, 0, 0.15)"
						>
							Voir la fiche complète →
						</RippleLink>
					</motion.footer>
				</motion.div>
			</motion.div>
		</>,
		document.body,
	);
}
