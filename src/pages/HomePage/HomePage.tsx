import "./HomePage.css";
import { motion } from "framer-motion";
import { RippleLink } from "../../components/RippleLink/RippleLink";
import { ArtworkHero } from "../../components/ArtworkHero/ArtworkHero";
import { useRandomImages } from "../../hooks/useImages";
import { useLanguage } from "../../hooks/useLanguage";
import { useMemo } from "react";

/* Reveal helpers: fade + slight rise when the section enters the viewport */
const sectionReveal = {
	hidden: { opacity: 0, y: 32 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
	},
};

const staggerGroup = {
	hidden: {},
	show: { transition: { staggerChildren: 0.12 } },
};

const HomePage = () => {
	const { t, languageCode } = useLanguage();
	const FEATURES = useMemo(
		() => [
			{
				title: t("homepage.features.celebration.title"),
				text: t("homepage.features.celebration.description"),
				accent: t("homepage.features.celebration.accent"),
				link: "/celebration",
				linkLabel: t("homepage.features.celebration.linkLabel"),
			},
			// {
			// 	title: t("homepage.features.calendars.title"),
			// 	text: t("homepage.features.calendars.description"),
			// 	accent: t("homepage.features.calendars.accent"),
			// 	link: "/celebration",
			// 	linkLabel: t("homepage.features.calendars.linkLabel"),
			// },
			{
				title: t("homepage.features.saints.title"),
				text: t("homepage.features.saints.description"),
				accent: t("homepage.features.saints.accent"),
				link: "/saints",
				linkLabel: t("homepage.features.saints.linkLabel"),
			},
			{
				title: t("homepage.features.gallery.title"),
				text: t("homepage.features.gallery.description"),
				accent: t("homepage.features.gallery.accent"),
				link: "/gallery",
				linkLabel: t("homepage.features.gallery.linkLabel"),
			},
		],
		[t],
	);
	// Une peinture aléatoire par carte ; purement décoratif, la page
	// fonctionne aussi tant que les images ne sont pas arrivées.
	const { images } = useRandomImages(FEATURES.length);

	return (
		<div className="home-page">
			<ArtworkHero
				eyebrow={t("hero.eyebrow")}
				description={t("hero.description")}
				languageCode={languageCode}
			>
				<RippleLink
					to="/celebration"
					className="artwork-hero__action artwork-hero__action--primary"
					rippleColor="rgba(0, 0, 0, 0.15)"
				>
					{t("celebrationPage.celebrationOfTheDay")}
				</RippleLink>
				<RippleLink to="/saints" className="artwork-hero__action">
					{t("hero.discoverSaints")}
				</RippleLink>
			</ArtworkHero>

			{/* ===== Intro éditoriale ===== */}
			<motion.section
				className="home-intro"
				variants={sectionReveal}
				key={languageCode}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.4 }}
			>
				<span className="home-intro__eyebrow">
					{t("homepage.project")}
				</span>
				<h2 className="home-intro__title">
					{t("homepage.projectTitle1")}
					<br />
					{t("homepage.projectTitle2")}
				</h2>
				<p className="home-intro__text">
					{t("homepage.projectDescription")}
				</p>
			</motion.section>

			{/* ===== Fonctionnalités (avec œuvres) ===== */}
			<motion.section
				className="home-features"
				key={`features-${languageCode}`}
				variants={staggerGroup}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.2 }}
			>
				{FEATURES.map((feature, index) => {
					const image = images[index];

					return (
						<motion.article
							key={feature.link}
							className="home-feature"
							variants={sectionReveal}
						>
							<div
								className="home-feature__artwork"
								aria-hidden="true"
							>
								{image && (
									<img
										src={image.image_url}
										alt=""
										loading="lazy"
										decoding="async"
										draggable={false}
									/>
								)}
							</div>

							<div className="home-feature__body">
								<span className="home-feature__accent">
									{feature.accent}
								</span>
								<h3 className="home-feature__title">
									{feature.title}
								</h3>
								<p className="home-feature__text">
									{feature.text}
								</p>
								<RippleLink
									to={feature.link}
									className="home-feature__link"
								>
									{feature.linkLabel} →
								</RippleLink>
							</div>
						</motion.article>
					);
				})}
			</motion.section>

			{/* ===== CTA final ===== */}
			<motion.section
				className="home-cta"
				variants={sectionReveal}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.5 }}
			>
				<h2 className="home-cta__title">{t("homepage.cta.title")}</h2>
				<RippleLink
					to="/celebration"
					className="home-cta__button"
					rippleColor="rgba(0, 0, 0, 0.15)"
				>
					{t("homepage.cta.button")}
				</RippleLink>
			</motion.section>
		</div>
	);
};

export { HomePage };
