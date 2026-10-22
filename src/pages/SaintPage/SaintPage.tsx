import "./SaintPage.css";
import { useMemo, useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

import { Loader } from "../../components/Loader/Loader";
import { RippleLink } from "../../components/RippleLink/RippleLink";
import { SaintMap } from "../../components/SaintMap/SaintMap";
import { useSaintBySlug } from "../../hooks/useSaints";
import { useLanguage } from "../../hooks/useLanguage";
import type { Attribute } from "../../types/Attribute";
import {
	centuryLabel,
	formatPartialDate,
	primaryImage,
	toRoman,
} from "../../utils/saintFormat";

import { ApiError } from "../../api/client";

const EASE = [0.22, 1, 0.36, 1] as const;

const articleGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.09 } },
};

const rise = {
	hidden: { opacity: 0, y: 18 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function StateBlock({
	tone = "neutral",
	children,
}: {
	tone?: "neutral" | "error";
	children: React.ReactNode;
}) {
	return (
		<motion.div
			className={`saint-page__state saint-page__state--${tone}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{children}
		</motion.div>
	);
}

function groupAttributes(attributes: Attribute[]) {
	const groups = new Map<string, Attribute[]>();
	for (const attr of attributes) {
		const key = attr.category || "Autres";
		groups.set(key, [...(groups.get(key) ?? []), attr]);
	}
	return Array.from(groups.entries());
}

// WIP NEED RESPONSIVE WITHOUT ASIDE
const SaintPage = () => {
	const { slug = "" } = useParams();
	const { languageCode, t } = useLanguage();
	const {
		detail: saint,
		loading,
		error,
	} = useSaintBySlug(slug, languageCode);

	const cover = primaryImage(saint?.images);
	const name = saint?.name || saint?.default_name || "";
	const attributeGroups = useMemo(
		() => groupAttributes(saint?.attributes ?? []),
		[saint?.attributes],
	);
	const places = saint?.places ?? [];
	const gallery = useMemo(
		() =>
			[...(saint?.images ?? [])].sort(
				(a, b) => a.sort_order - b.sort_order,
			),
		[saint?.images],
	);

	const getPlaceRoleLabel = (role: string) => {
		switch (role) {
			case "birth":
				return t("saint.birth");
			case "death":
				return t("saint.death");
			case "activity":
				return t("saint.activity");
			case "burial":
				return t("saint.burial");
			default:
				return role;
		}
	};

	//Ordre d'affichage des attributs
	const categoryOrder = ["title", "order", "symbol"];

	// Ecoute du scroll du aside pour le flou :
	const asideRef = useRef(null);
	const [scrollState, setScrollState] = useState({
		top: false,
		bottom: false,
	});

	useEffect(() => {
		const aside = asideRef.current;
		if (!aside) return;

		const updateScrollState = () => {
			const maxScroll = aside.scrollHeight - aside.clientHeight;
			const hasScroll = maxScroll > 1;

			setScrollState({
				top: hasScroll && aside.scrollTop > 1,
				bottom: hasScroll && aside.scrollTop < maxScroll - 1,
			});
		};

		updateScrollState();

		aside.addEventListener("scroll", updateScrollState, {
			passive: true,
		});

		window.addEventListener("resize", updateScrollState);

		return () => {
			aside.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, []);

	return (
		<div className="saint-page">
			<nav className="saint-page__breadcrumb" aria-label="Fil d'Ariane">
				<RippleLink to="/saints" className="saint-page__back">
					← {t("saint.backToList")}
				</RippleLink>
			</nav>

			<AnimatePresence mode="wait">
				{loading ? (
					<StateBlock key="loading">
						<Loader size={56} />
					</StateBlock>
				) : error || !saint ? (
					<StateBlock key="error" tone="error">
						{t("saint.loadingError")}
						{error && (
							<span className="saint-page__state-detail">
								{error instanceof ApiError && (
									<>
										{error.status}
										<br />
									</>
								)}
								{error.message}
							</span>
						)}
					</StateBlock>
				) : (
					<div className="saint-page-container">
						<motion.article
							key={`${saint.id}-${languageCode}`}
							className="saint-article"
							variants={articleGroup}
							initial="hidden"
							animate="show"
							exit={{ opacity: 0, transition: { duration: 0.2 } }}
						>
							{/* ===== Cover ===== */}
							<header
								className={`saint-cover${cover ? "" : " saint-cover--no-image"}`}
							>
								{cover && (
									<motion.img
										className="saint-cover__image"
										src={cover.image_url}
										alt={cover.alt_text || name}
										decoding="async"
										variants={rise}
									/>
								)}
								<div
									className="saint-cover__shade"
									aria-hidden="true"
								/>
								<motion.div
									className="saint-cover__text"
									variants={rise}
								>
									{centuryLabel(saint.century, t) && (
										<span className="saint-cover__eyebrow">
											{centuryLabel(saint.century, t)}
										</span>
									)}
									<h1 className="saint-cover__title">
										{name}
									</h1>
									{cover?.creator && (
										<span className="saint-cover__credit">
											{cover.title}
											{cover.creator &&
												` — ${cover.creator}`}
											{cover.date_label &&
												`, ${cover.date_label}`}
										</span>
									)}
								</motion.div>
							</header>

							{/* ===== Facts ===== */}
							<motion.dl className="saint-facts" variants={rise}>
								<div className="saint-fact">
									<dt>{t("saint.birth")}</dt>
									<dd>
										{formatPartialDate(
											{
												year: saint.birth_year,
												month: saint.birth_month,
												day: saint.birth_day,
												approximate:
													saint.birth_is_approximate,
											},
											languageCode,
										)}
										{places.find(
											(p) => p.role === "birth",
										) && (
											<span className="saint-fact__note">
												{
													places.find(
														(p) =>
															p.role === "birth",
													)!.name
												}
											</span>
										)}
									</dd>
								</div>
								<div className="saint-fact">
									<dt>{t("saint.death")}</dt>
									<dd>
										{formatPartialDate(
											{
												year: saint.death_year,
												month: saint.death_month,
												day: saint.death_day,
												approximate:
													saint.death_is_approximate,
											},
											languageCode,
										)}
										{places.find(
											(p) => p.role === "death",
										) && (
											<span className="saint-fact__note">
												{
													places.find(
														(p) =>
															p.role === "death",
													)!.name
												}
											</span>
										)}
									</dd>
								</div>
								<div className="saint-fact">
									<dt>{t("century.century")}</dt>
									<dd>
										{saint.century != null
											? toRoman(saint.century)
											: "—"}
									</dd>
								</div>
							</motion.dl>

							{/* ===== Biographie ===== */}
							<motion.div className="saint-prose" variants={rise}>
								{saint.short_description && (
									<p className="saint-prose__lead">
										{saint.short_description}
									</p>
								)}
								{saint.full_biography ? (
									<div className="saint-prose__markdown">
										<ReactMarkdown>
											{saint.full_biography}
										</ReactMarkdown>
									</div>
								) : (
									<p className="saint-prose__empty">
										{t("saint.noBiography")}
									</p>
								)}
								{saint.slug === "saint-lawrence" && (
									<p className="ex-voto">
										Reconnaissance à saint Laurent — 26
										décembre 2025
									</p>
								)}
							</motion.div>

							{/* ===== Patronages & attributs ===== */}
							<motion.section
								className="saint-meta"
								variants={rise}
							>
								<div className="saint-meta__block">
									<h2 className="saint-meta__title">
										{t("saint.patronages")}
									</h2>
									{saint.patronages?.length ? (
										<ul className="saint-meta__tags">
											{saint.patronages.map((p) => (
												<li
													key={p.code}
													className="saint-tag"
													title={p.description}
												>
													{p.label}
												</li>
											))}
										</ul>
									) : (
										<p className="saint-meta__empty">
											{t("saint.noPatronages")}
										</p>
									)}
								</div>

								<div className="saint-meta__block">
									<h2 className="saint-meta__title">
										{t("saint.attributes")}
									</h2>
									{attributeGroups.length ? (
										attributeGroups.map(
											([category, attrs]) => (
												<div
													key={category}
													className="saint-meta__group"
												>
													<span className="saint-meta__category">
														{category}
													</span>
													<ul className="saint-meta__tags">
														{attrs.map((a) => (
															<li
																key={a.code}
																className="saint-tag"
																title={
																	a.description
																}
															>
																{a.label}
															</li>
														))}
													</ul>
												</div>
											),
										)
									) : (
										<p className="saint-meta__empty">
											{t("saint.noAttributes")}
										</p>
									)}
								</div>
							</motion.section>

							{/* ===== Lieux ===== */}
							<motion.section
								className="saint-places"
								variants={rise}
							>
								<h2 className="saint-section__title">
									{t("saint.places")}
								</h2>
								{places.length ? (
									<ul className="saint-places__list">
										{places.map((place) => (
											<li
												key={`${place.role}-${place.code}`}
												className="saint-place"
											>
												<span className="saint-place__role">
													{getPlaceRoleLabel(
														place.role,
													)}
												</span>
												<span className="saint-place__name">
													{place.name}
												</span>
												<span className="saint-place__country">
													{place.country_code}
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className="saint-meta__empty">
										{t("saint.noPlaces")}
									</p>
								)}
								{/* Carte interactive */}
								<SaintMap places={places} />
							</motion.section>

							{/* ===== Galerie ===== */}
							{gallery.length > 0 && (
								<motion.section
									className="saint-gallery"
									variants={rise}
								>
									<h2 className="saint-section__title">
										{t("saint.gallery")}
									</h2>
									<ul className="saint-gallery__grid">
										{gallery.map((img) => (
											<li
												key={img.id}
												className="saint-artwork"
											>
												<figure>
													<div className="saint-artwork__frame">
														<img
															src={img.image_url}
															alt={
																img.alt_text ||
																img.title
															}
															loading="lazy"
															decoding="async"
														/>
													</div>
													<figcaption className="saint-artwork__caption">
														<span className="saint-artwork__title">
															{img.title}
														</span>
														{(img.creator ||
															img.date_label) && (
															<span className="saint-artwork__meta">
																{[
																	img.creator,
																	img.date_label,
																]
																	.filter(
																		Boolean,
																	)
																	.join(", ")}
															</span>
														)}
														{img.repository && (
															<span className="saint-artwork__meta">
																{img.repository}
															</span>
														)}
													</figcaption>
												</figure>
											</li>
										))}
									</ul>
								</motion.section>
							)}
						</motion.article>
						<aside
							ref={asideRef}
							className={`aside-column
        					${scrollState.top ? "aside-column--fade-top" : ""}
             				${scrollState.bottom ? "aside-column--fade-bottom" : ""}`}
						>
							{attributeGroups
								.toSorted(
									([categoryA], [categoryB]) =>
										categoryOrder.indexOf(categoryA) -
										categoryOrder.indexOf(categoryB),
								)
								.map(([category, attrs]) => (
									<div
										key={category}
										className={`panel aside-column__${category}`}
									>
										<h3 className="panel__title">
											{attrs.length > 1
												? t(`saint.${category}s`)
												: t(`saint.${category}`)}
										</h3>

										<ul className="aside__category-list">
											{attrs.map((a) => (
												<li
													key={a.code}
													title={a.description}
													className="aside__category-item"
												>
													<span className="aside__category-dot" />
													<div className="aside__category-item-body">
														<span className="aside__category-item__name">
															{a.label}
														</span>
														<span className="aside__category-item__description">
															{a.description}
														</span>
													</div>
												</li>
											))}
										</ul>
									</div>
								))}
							{saint.patronages?.length && (
								<div className="panel aside-column__patronages">
									<h3 className="panel__title">
										{saint.patronages.length > 1
											? t(`saint.patronages`)
											: t(`saint.patronage`)}
									</h3>
									<ul className="aside__category-list">
										{saint.patronages.map((p) => (
											<li
												key={p.code}
												title={p.description}
												className="aside__category-item"
											>
												<span className="aside__category-dot" />
												<div className="aside__category-item-body">
													<span className="aside__category-item__name">
														{p.label}
													</span>
													<span className="aside__category-item__description">
														{p.description}
													</span>
												</div>
											</li>
										))}
									</ul>
								</div>
							)}
						</aside>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export { SaintPage };
