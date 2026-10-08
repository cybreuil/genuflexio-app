import "./CelebrationOfTheDay.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

// Components
import { CalendarSelector } from "../../components/CalendarSelector/CalendarSelector";
// import { LiturgicalColor } from "../../components/LiturgicalColor/LiturgicalColor";
import { MiniCalendar } from "../../components/MiniCalendar/MiniCalendar";
// import { LiturgicalRank } from "../../components/LiturgicalRank/LiturgicalRank";
import { LiturgicalSeason } from "../../components/LiturgicalSeason/LiturgicalSeason";
import { SecondaryCelebrations } from "../../components/SecondaryCelebrations/SecondaryCelebrations";
import { Loader } from "../../components/Loader/Loader";
import { RippleLink } from "../../components/RippleLink/RippleLink";

// Hooks
import { useCalendar } from "../../hooks/useCalendar";
import { useCelebration } from "../../hooks/useCelebration";
import { useLanguage } from "../../hooks/useLanguage";
import { useTheme } from "../../hooks/useTheme";
import { MarkerDragEvent } from "maplibre-gl";

/* ===== Animation presets ===== */

const EASE = [0.22, 1, 0.36, 1] as const;

const sidebarGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const sidebarItem = (fromX: number) => ({
	hidden: { opacity: 0, x: fromX },
	show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
});

const articleGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.09 } },
};

const rise = {
	// We use inset of 18px in css to avoid clipping the text when it moves up for the images
	// So if we change this value, we must also change the inset in CelebrationOfTheDay.css !!
	// inset is situated in .celebration-cover__image
	hidden: { opacity: 0, y: 18 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const coverText = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const header = {
	hidden: {
		opacity: 0,
		y: 24,
	},
	show: {
		opacity: 1,
		y: 0,
		height: "300px",
		transition: { duration: 0.7, ease: EASE },
	},
	exit: {
		opacity: 0,
		height: "0",
		transition: { duration: 2, ease: EASE },
	},
};

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
			className={`celebration-state celebration-state--${tone}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{children}
		</motion.div>
	);
}

const CelebrationOfTheDay: React.FC = () => {
	const { date: dateParam } = useParams();
	const date = dateParam ?? new Date().toISOString().split("T")[0];

	// header visibility
	const [showIntro, setShowIntro] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowIntro(false);
		}, 3000);
		return () => clearTimeout(timer);
	}, []);

	const { languageCode, t } = useLanguage();
	const {
		calendar,
		isLoading: isCalendarLoading,
		error: calendarError,
	} = useCalendar();

	const {
		celebration,
		secondaryCelebrations,
		saints,
		invalidDate,
		liturgicalSeason,
		isLoading: isCelebrationLoading,
		error: celebrationError,
	} = useCelebration(calendar?.code, date, languageCode);

	const liturgicalColor =
		celebration?.liturgical_color_hex ||
		liturgicalSeason?.hex_color ||
		"#8b7f73";

	// Fallback for white liturgical on light theme
	const isWhite = liturgicalColor.toLowerCase() === "#ffffff";
	const { theme } = useTheme();

	const effectiveLiturgicalColorForFirstLetter =
		theme === "light" && isWhite
			? "var(--color-text-primary)"
			: liturgicalColor;

	// Expose the liturgical colour to the whole page (body::before gradient, etc.)
	useEffect(() => {
		document.body.style.setProperty("--liturgical-color", liturgicalColor);
		return () => {
			document.body.style.removeProperty("--liturgical-color");
		};
	}, [liturgicalColor]);

	// Human readable date, localised ("mardi 8 septembre 2026")
	const formattedDate = useMemo(() => {
		if (invalidDate) return "";
		try {
			return new Intl.DateTimeFormat(languageCode, {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(new Date(date));
		} catch {
			return date;
		}
	}, [date, languageCode, invalidDate]);

	const coverSaint = saints?.[0];
	const isLoading = isCalendarLoading || isCelebrationLoading;
	const error = calendarError ?? celebrationError;

	return (
		<div className="celebration-page-container">
			<AnimatePresence>
				{showIntro && (
					<motion.header
						className="celebration-page-header"
						variants={header}
						initial="hidden"
						animate="show"
						exit="exit"
					>
						<span className="celebration-page-header__eyebrow">
							─ Liturgie
						</span>

						<h1 className="celebration-page-header__title">
							Célébration du jour
						</h1>

						<p className="celebration-page-header__text">
							Discover the feast of the day, its liturgical color,
							rank, and associated saints.
						</p>
					</motion.header>
				)}
			</AnimatePresence>
			<motion.div
				className="celebration-page"
				layout
				transition={{ duration: 0.3, ease: EASE }}
			>
				{/* ===== Left sidebar : date & liturgical facts ===== */}
				<aside className="celebration-page__aside celebration-page__aside--left">
					<motion.div
						className="celebration-page__sticky"
						variants={sidebarGroup}
						initial="hidden"
						animate="show"
					>
						<motion.div variants={sidebarItem(-32)}>
							<MiniCalendar />
						</motion.div>
						{/*<motion.div variants={sidebarItem(-32)}>
						<LiturgicalColor
							color={liturgicalColor}
							colorName={
								celebration?.liturgical_color_name ||
								liturgicalSeason?.color_label ||
								t("common.unknown")
							}
						/>
					</motion.div>*/}
						{/*<motion.div variants={sidebarItem(-32)}>
						<LiturgicalRank
							rank={
								celebration?.rank_label || t("common.unknown")
							}
						/>
					</motion.div>*/}
						<motion.div variants={sidebarItem(-32)}>
							<LiturgicalSeason
								season={liturgicalSeason}
								date={date}
							/>
						</motion.div>
					</motion.div>
				</aside>

				{/* ===== Main article ===== */}
				<main className="celebration-article">
					<AnimatePresence mode="wait">
						{invalidDate ? (
							<StateBlock key="invalid">
								{t("celebration.invalidDate")}
							</StateBlock>
						) : isLoading ? (
							<StateBlock key="loading">
								<Loader size={56} />
							</StateBlock>
						) : error ? (
							<StateBlock key="error" tone="error">
								{calendarError
									? t("calendar.loadingError")
									: t("celebration.loadingError")}
								<span className="celebration-state__detail">
									{error.message}
								</span>
							</StateBlock>
						) : !celebration ? (
							<StateBlock key="empty">
								<span className="celebration-state__date">
									{formattedDate}
								</span>
								{t("celebration.noCelebration")}
							</StateBlock>
						) : (
							<motion.article
								key={(celebration.id, date)}
								className="celebration-article__inner"
								variants={articleGroup}
								initial="hidden"
								animate="show"
								exit={{
									opacity: 0,
									transition: { duration: 0.2 },
								}}
								style={
									{
										"--celebration-accent":
											effectiveLiturgicalColorForFirstLetter,
									} as React.CSSProperties
								}
							>
								{/* --- Cover --- */}
								<header
									className={`celebration-cover${
										coverSaint?.saint_image_url
											? ""
											: " celebration-cover--no-image"
									}`}
								>
									{coverSaint?.saint_image_url && (
										<motion.img
											className="celebration-cover__image"
											src={coverSaint.saint_image_url}
											alt={coverSaint.saint_name}
											decoding="async"
											variants={rise}
										/>
									)}
									<div
										className="celebration-cover__shade"
										aria-hidden="true"
									/>

									<motion.div
										className="celebration-cover__text"
										variants={coverText}
									>
										<motion.span
											className="celebration-cover__eyebrow"
											variants={rise}
										>
											<time dateTime={date}>
												{formattedDate}
											</time>
											{/*{celebration.rank_label && (
											<>
												<span className="celebration-cover__dot" />
												{celebration.rank_label}
											</>
										)}*/}
										</motion.span>
										<motion.h1
											className="celebration-cover__title"
											variants={rise}
										>
											{celebration.feast_name}
										</motion.h1>
									</motion.div>
								</header>

								{/* --- Meta chips --- */}
								<motion.dl
									className="celebration-facts"
									variants={rise}
								>
									<div className="celebration-fact">
										<dt>{t("liturgical.color")}</dt>
										<dd>
											<span
												className="celebration-fact__swatch"
												style={{
													background: liturgicalColor,
												}}
											/>
											{celebration.liturgical_color_name ||
												liturgicalSeason?.color_label ||
												t("common.unknown")}
										</dd>
									</div>
									<div className="celebration-fact">
										<dt>{t("liturgical.rank")}</dt>
										<dd>
											{celebration.rank_label ||
												t("common.unknown")}
											{/*{celebration.is_optional && (
											<span className="celebration-fact__note">
												{t("celebration.optional")}
											</span>
										)}*/}
										</dd>
									</div>
									<div className="celebration-fact">
										<dt>{t("liturgical.season")}</dt>
										<dd>
											{liturgicalSeason?.label ||
												t("common.unknown")}
										</dd>
									</div>
								</motion.dl>

								{/* --- Body --- */}
								<motion.div
									className={`celebration-prose ${
										celebration.feast_description
											? ""
											: "celebration-prose--empty"
									}`}
									variants={rise}
								>
									{celebration.feast_description ? (
										<ReactMarkdown>
											{celebration.feast_description}
										</ReactMarkdown>
									) : (
										<p>{t("celebration.noDescription")}</p>
									)}
								</motion.div>

								{/* --- Linked saints --- */}
								<motion.section
									className="celebration-saints"
									variants={rise}
								>
									<h2 className="celebration-saints__title">
										{t("celebration.saints")}
									</h2>

									{saints && saints.length > 0 ? (
										<ul className="celebration-saints__list">
											{saints.map((saint) => (
												<RippleLink
													className="saint-chip"
													key={saint.saint_id}
													to={`/saints/${saint.saint_slug}`}
												>
													<span className="saint-chip__thumb">
														{saint.saint_image_url && (
															<img
																src={
																	saint.saint_image_url
																}
																alt=""
																loading="lazy"
																decoding="async"
															/>
														)}
													</span>
													<span className="saint-chip__body">
														<span className="saint-chip__name">
															{saint.saint_name}
														</span>
														{saint.saint_life_label && (
															<span className="saint-chip__life-label">
																{
																	saint.saint_life_label
																}
															</span>
														)}
													</span>
												</RippleLink>
											))}
										</ul>
									) : (
										<p className="celebration-saints__empty">
											{t("celebration.noSaint")}
										</p>
									)}
								</motion.section>
							</motion.article>
						)}
					</AnimatePresence>
				</main>

				{/* ===== Right sidebar : calendar choice & context ===== */}
				<aside className="celebration-page__aside celebration-page__aside--right">
					<motion.div
						className="celebration-page__sticky"
						variants={sidebarGroup}
						initial="hidden"
						animate="show"
					>
						<motion.div variants={sidebarItem(32)}>
							<CalendarSelector />
						</motion.div>
						<motion.div variants={sidebarItem(32)}>
							<SecondaryCelebrations
								secondaryCelebrations={secondaryCelebrations}
								isLoading={isCelebrationLoading}
								error={calendarError ?? celebrationError}
								fallbackColor={
									liturgicalSeason?.hex_color || "#8b7f73"
								}
							/>
						</motion.div>
					</motion.div>
				</aside>
			</motion.div>
		</div>
	);
};

export { CelebrationOfTheDay };
