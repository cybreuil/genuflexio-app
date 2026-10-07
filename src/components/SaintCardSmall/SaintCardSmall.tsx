import "./SaintCardSmall.css";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { SaintApi } from "../../types/Saint.ts";
import { centuryLabel } from "../../utils/saintFormat";
import { TRANSITIONS } from "../../styles/theme.ts";
import { useLanguage } from "../../hooks/useLanguage.ts";

const cardReveal = {
	hidden: { opacity: 0, y: 24 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
	},
};

const MotionLink = motion(Link);

const SaintCardSmall = ({
	saint,
	// onClick,
	index,
	// enableLayoutId = true,
}: {
	saint: SaintApi;
	// onClick: () => void;
	index: number;
	// enableLayoutId?: boolean;
}) => {
	// Language import for accent translation
	const { t } = useLanguage();

	// Accent translation for the saint's century, using a non-breaking space if no century is provided
	const accent = centuryLabel(saint.century, t) || "\u00a0";

	// Get the initial letter of the saint's name, trimming whitespace and converting to uppercase, or defaulting to an empty string if the name is not available
	const initial = saint.name?.trim().charAt(0).toUpperCase() ?? "";

	// Handle keyboard events for accessibility, triggering the onClick function when the Enter or Space key is pressed
	// We don't use since now it's a link
	//
	// const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
	// 	if (event.key === "Enter" || event.key === " ") {
	// 		event.preventDefault();
	// 		onClick();
	// 	}
	// };

	return (
		<MotionLink
			to={`/saints/${saint.slug}`}
			className="saint-card"
			// layoutId={`saint-card-${saint.id}`}
			variants={cardReveal}
			// role="button"
			// tabIndex={0}
			aria-label={saint.name}
			// onClick={onClick}
			// onKeyDown={handleKeyDown}
			transition={TRANSITIONS.normal}
		>
			<div className="saint-card__artwork" aria-hidden="true">
				{saint.image_url ? (
					<img
						// layoutId={`saint-img-${saint.id}`}
						src={saint.image_url}
						alt=""
						loading={index < 3 ? "eager" : "lazy"}
						decoding="async"
						draggable={false}
					/>
				) : (
					<span className="saint-card__initial">{initial}</span>
				)}
			</div>

			<div className="saint-card__body">
				<motion.span
					className="saint-card__accent"
					layoutId={`saint-eyebrow-${saint.id}`}
				>
					{accent}
				</motion.span>
				<motion.h3
					className="saint-card__name"
					layoutId={`saint-name-${saint.id}`}
				>
					{saint.name}
				</motion.h3>
				<span className="saint-card__cta">Découvrir →</span>
			</div>
		</MotionLink>
	);
};

export { SaintCardSmall };
