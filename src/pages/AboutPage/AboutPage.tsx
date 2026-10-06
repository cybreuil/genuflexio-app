import "./AboutPage.css";
import { motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { useRandomImages } from "../../hooks/useImages";
import { RippleLink } from "../../components/RippleLink/RippleLink";

/* ===== Animation presets ===== */

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
	hidden: { opacity: 0, y: 28 },
	show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const stagger = {
	hidden: {},
	show: { transition: { staggerChildren: 0.1 } },
};

const inView = {
	variants: reveal,
	initial: "hidden",
	whileInView: "show",
	viewport: { once: true, amount: 0.3 },
} as const;

const VALUES = [0, 1, 2] as const;
const NUMBERS = [0, 1, 2, 3] as const;
const TIMELINE = [0, 1, 2, 3] as const;

const CONTACT_EMAIL = "contact@genuflexio.app";
const GITHUB_URL = "https://github.com/cybreuil";

const AboutPage = () => {
	const { t } = useLanguage();
	// 3 œuvres décoratives : une pour le manifeste, deux pour la mosaïque crédits
	const { images } = useRandomImages(3);

	return (
		<div className="about-page">
			{/* ===== Header ===== */}
			<motion.header
				className="about-header"
				variants={reveal}
				initial="hidden"
				animate="show"
			>
				<span className="about-eyebrow">{t("about.eyebrow")}</span>
				<h1 className="about-header__title">{t("about.title")}</h1>
				<p className="about-header__lead">{t("about.lead")}</p>
			</motion.header>

			{/* ===== Manifeste : texte + œuvre ===== */}
			<motion.section className="about-manifesto" {...inView}>
				<div className="about-manifesto__text">
					<span className="about-eyebrow">
						{t("about.manifesto.eyebrow")}
					</span>
					<h2 className="about-section__title">
						{t("about.manifesto.title")}
					</h2>
					<p className="about-prose">{t("about.manifesto.p1")}</p>
					<p className="about-prose">{t("about.manifesto.p2")}</p>
					<blockquote className="about-quote">
						<p>{t("about.manifesto.quote")}</p>
						<cite>— {t("about.manifesto.quoteAuthor")}</cite>
					</blockquote>
				</div>
				<figure className="about-manifesto__artwork">
					{images[0] && (
						<>
							<img
								src={images[0].image_url}
								alt={images[0].alt_text || images[0].title}
								loading="lazy"
								decoding="async"
								draggable={false}
							/>
							<figcaption>
								{images[0].title}
								{images[0].creator && ` — ${images[0].creator}`}
							</figcaption>
						</>
					)}
				</figure>
			</motion.section>

			{/* ===== Chiffres ===== */}
			<motion.section
				className="about-numbers"
				variants={stagger}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.4 }}
				aria-label={t("about.numbers.eyebrow")}
			>
				{NUMBERS.map((i) => (
					<motion.div
						key={i}
						className="about-number"
						variants={reveal}
					>
						<span className="about-number__value">
							{t(`about.numbers.${i}.value`)}
						</span>
						<span className="about-number__label">
							{t(`about.numbers.${i}.label`)}
						</span>
					</motion.div>
				))}
			</motion.section>

			{/* ===== Valeurs ===== */}
			<section className="about-values">
				<motion.div className="about-values__head" {...inView}>
					<span className="about-eyebrow">
						{t("about.values.eyebrow")}
					</span>
					<h2 className="about-section__title">
						{t("about.values.title")}
					</h2>
				</motion.div>
				<motion.div
					className="about-values__grid"
					variants={stagger}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true, amount: 0.25 }}
				>
					{VALUES.map((i) => (
						<motion.article
							key={i}
							className="about-value"
							variants={reveal}
						>
							<span className="about-value__index">0{i + 1}</span>
							<h3 className="about-value__title">
								{t(`about.values.${i}.title`)}
							</h3>
							<p className="about-value__text">
								{t(`about.values.${i}.text`)}
							</p>
						</motion.article>
					))}
				</motion.div>
			</section>

			{/* ===== Roadmap ===== */}
			<section className="about-timeline">
				<motion.div className="about-timeline__head" {...inView}>
					<span className="about-eyebrow">
						{t("about.timeline.eyebrow")}
					</span>
					<h2 className="about-section__title">
						{t("about.timeline.title")}
					</h2>
				</motion.div>
				<motion.ol
					className="about-timeline__list"
					variants={stagger}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true, amount: 0.2 }}
				>
					{TIMELINE.map((i) => {
						const status = t(`about.timeline.${i}.status`);
						return (
							<motion.li
								key={i}
								className={`about-step about-step--${status}`}
								variants={reveal}
							>
								<span
									className="about-step__dot"
									aria-hidden="true"
								/>
								<div className="about-step__body">
									<h3 className="about-step__title">
										{t(`about.timeline.${i}.title`)}
									</h3>
									<p className="about-step__text">
										{t(`about.timeline.${i}.text`)}
									</p>
								</div>
							</motion.li>
						);
					})}
				</motion.ol>
			</section>

			{/* ===== Crédits ===== */}
			<motion.section className="about-credits" {...inView}>
				<div className="about-credits__mosaic" aria-hidden="true">
					{images.slice(1, 3).map((img) => (
						<img
							key={img.id}
							src={img.image_url}
							alt=""
							loading="lazy"
							decoding="async"
							draggable={false}
						/>
					))}
				</div>
				<div className="about-credits__text">
					<span className="about-eyebrow">
						{t("about.credits.eyebrow")}
					</span>
					<h2 className="about-section__title">
						{t("about.credits.title")}
					</h2>
					<p className="about-prose">{t("about.credits.text")}</p>
					<div className="about-credits__links">
						<a
							className="about-link"
							href={GITHUB_URL}
							target="_blank"
							rel="noreferrer"
						>
							{t("about.credits.github")} ↗
						</a>
					</div>
				</div>
			</motion.section>

			{/* ===== CTA ===== */}
			<motion.section className="about-cta" {...inView}>
				<h2 className="about-cta__title">{t("about.cta.title")}</h2>
				<div className="about-cta__actions">
					<RippleLink
						to="/celebration"
						className="about-cta__button about-cta__button--primary"
						rippleColor="rgba(0, 0, 0, 0.15)"
					>
						{t("about.cta.primary")}
					</RippleLink>
					<RippleLink to="/saints" className="about-cta__button">
						{t("about.cta.secondary")}
					</RippleLink>
				</div>
				<p className="about-cta__contact">
					{t("about.cta.contact")}{" "}
					<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
				</p>
			</motion.section>
		</div>
	);
};

export { AboutPage };
