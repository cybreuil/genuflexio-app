import { motion } from "framer-motion";
import { TRANSITIONS } from "../../styles/theme";
import "./NotFoundPage.css";
import { RippleLink } from "../../components/RippleLink/RippleLink";
// import { Logo } from "../../components/Logo/Logo";
import { useLanguage } from "../../hooks/useLanguage";

const NotFoundPage = () => {
	const { t } = useLanguage();

	// Animation pour le halo qui pulse
	// const haloVariants = {
	// 	initial: { scale: 1, opacity: 0.3 },
	// 	animate: {
	// 		scale: [1, 1.2, 1],
	// 		opacity: [0.3, 0.6, 0.3],
	// 		transition: {
	// 			duration: 3,
	// 			repeat: Infinity,
	// 			ease: "easeInOut",
	// 		},
	// 	},
	// };

	// Animation pour les chiffres qui flottent
	// const floatVariants = {
	// 	initial: { y: 0 },
	// 	animate: {
	// 		y: [-10, 10, -10],
	// 		transition: {
	// 			duration: 4,
	// 			repeat: Infinity,
	// 			ease: "easeInOut",
	// 		},
	// 	},
	// };

	return (
		<motion.div
			className="not-found-page"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={TRANSITIONS.slower}
		>
			{/* Texte principal */}
			<motion.h1
				className="not-found-title"
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ ...TRANSITIONS.slow, delay: 0.9 }}
			>
				{t("404.text")}
			</motion.h1>
			{/* Halo de fond animé */}
			{/*<motion.div
				className="not-found-halo"
				variants={haloVariants}
				initial="initial"
				animate="animate"
			/>*/}

			{/* Logo avec animation */}
			{/*<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ ...TRANSITIONS.normal, delay: 0.2 }}
			>
				<Logo color="var(--color-primary)" maxWidth={200} />
			</motion.div>*/}

			{/* Grand 404 avec effet de flottement */}
			<motion.div
				className="not-found-number"
				// variants={floatVariants}
				// initial="initial"
				// animate="animate"
			>
				<motion.span
					initial={{ x: -50, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ ...TRANSITIONS.normal, delay: 0.3 }}
				>
					4
				</motion.span>
				<motion.span
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ ...TRANSITIONS.normal, delay: 0.5 }}
					className="not-found-zero"
				>
					0
				</motion.span>
				<motion.span
					initial={{ x: 50, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ ...TRANSITIONS.normal, delay: 0.7 }}
				>
					4
				</motion.span>
			</motion.div>

			<motion.p
				className="not-found-description"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ ...TRANSITIONS.slow, delay: 1.1 }}
			>
				{t("404.description")}
			</motion.p>

			{/* Boutons de navigation */}
			<motion.nav
				className="not-found-nav"
				initial={{ y: 30, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ ...TRANSITIONS.slower, delay: 1.5 }}
			>
				<RippleLink to="/" className="not-found-link primary">
					{t("nav.home")}
				</RippleLink>
				<RippleLink
					to="/celebration"
					className="not-found-link secondary"
				>
					{t("nav.celebration")}
				</RippleLink>
			</motion.nav>

			{/* Petite citation en bas */}
			{/*<motion.div
				className="not-found-quote"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.5, duration: 1 }}
			>
				<em>"Not all who wander are lost"</em>
				<span className="not-found-quote-author">— J.R.R. Tolkien</span>
			</motion.div>*/}
		</motion.div>
	);
};

export { NotFoundPage };
