import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { GithubLogo } from "../../icons";
import { useLanguage } from "../../hooks/useLanguage";
import { EASINGS } from "../../styles/theme";
import "./Footer.css";

const reveal = {
	hidden: { opacity: 0, y: 24 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, ease: EASINGS.out },
	},
};

const Footer = () => {
	const { t } = useLanguage();
	const year = new Date().getFullYear();

	return (
		<motion.footer
			className="footer"
			variants={reveal}
			initial="hidden"
			whileInView="show"
			viewport={{ once: true, amount: 0.3 }}
			layout="position"
		>
			<div className="footer__top">
				<div className="footer__brand">
					<Link
						to="/"
						className="footer__wordmark"
						aria-label="Genuflexio"
					>
						<span className="footer__logo" aria-hidden="true">
							<Logo color="currentColor" />
						</span>
						Genuflexio
					</Link>
					<p className="footer__tagline">{t("footer.tagline")}</p>
				</div>

				<nav className="footer__nav" aria-label={t("footer.explore")}>
					<h3 className="footer__heading">{t("footer.explore")}</h3>
					<ul>
						<li>
							<Link to="/celebration">
								{t("nav.celebration")}
							</Link>
						</li>
						<li>
							<Link to="/saints">{t("nav.saints")}</Link>
						</li>
						<li>
							<Link to="/search">{t("nav.search")}</Link>
						</li>
					</ul>
				</nav>

				<nav className="footer__nav" aria-label={t("footer.project")}>
					<h3 className="footer__heading">{t("footer.project")}</h3>
					<ul>
						<li>
							<Link to="/about">{t("nav.about")}</Link>
						</li>
						<li>
							<a
								href="https://github.com/cybreuil"
								target="_blank"
								rel="noopener noreferrer"
							>
								<GithubLogo fill="currentColor" />
								GitHub
							</a>
						</li>
						<li>
							<a href="mailto:cybreuil@gmail.com">
								{t("nav.contact")}
							</a>
						</li>
					</ul>
				</nav>
			</div>

			<div className="footer__bottom">
				<p>
					© {year} Genuflexio. {t("credits.copyright")}
				</p>
				<p className="footer__artworks">{t("footer.artworks")}</p>
			</div>
		</motion.footer>
	);
};

export { Footer };
