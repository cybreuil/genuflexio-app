import "./SecondaryCelebrations.css";
import type { Celebration } from "../../types/Celebration";
import React from "react";
import { Loader } from "../Loader/Loader";
import { useLanguage } from "../../hooks/useLanguage";
import { motion } from "framer-motion";
import { TRANSITIONS } from "../../styles/theme";

type SecondaryCelebrationsProps = {
	secondaryCelebrations: Celebration[] | null;
	isLoading: boolean;
	error: Error | null;
	fallbackColor: string;
	mainCelebration: Celebration | null;
	activeCelebration: Celebration | null;
	onSelectCelebration: (celebration: Celebration) => void;
	onRestoreCelebration: () => void;
};

const SecondaryCelebrations = ({
	secondaryCelebrations,
	isLoading,
	error,
	fallbackColor,
	mainCelebration,
	activeCelebration,
	onSelectCelebration,
	onRestoreCelebration,
}: SecondaryCelebrationsProps) => {
	const { t } = useLanguage();

	const visibleCelebrations = (secondaryCelebrations ?? []).filter(
		(c) => c.id !== activeCelebration?.id && c.id !== mainCelebration?.id,
	);

	const hasSelectedSecondary =
		activeCelebration != null &&
		mainCelebration != null &&
		activeCelebration.id !== mainCelebration.id;

	const isSameRankAsMain =
		activeCelebration != null &&
		mainCelebration != null &&
		activeCelebration.rank_precedence === mainCelebration.rank_precedence;

	return (
		<motion.section className="panel secondary-celebrations" layout="size">
			<motion.h3
				className="panel__title"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				layout="position"
			>
				{t("celebration.otherCelebrations")}
			</motion.h3>

			{isLoading ? (
				<Loader size={32} />
			) : error ? (
				<p className="panel__error">{t("celebration.loadingError")}</p>
			) : !secondaryCelebrations?.length ? (
				<motion.p
					className="panel__empty"
					layout="position"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				>
					{t("celebration.noOtherCelebrations")}
				</motion.p>
			) : (
				<motion.ul
					className="secondary-celebrations__list"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1, transition: TRANSITIONS.slower }}
					layout="position"
					key={
						visibleCelebrations.map((c) => c.id).join("-") +
						(hasSelectedSecondary ? "-selected" : "")
					}
				>
					{hasSelectedSecondary && (
						<>
							<li className="secondary-celebrations__heading">
								{t(
									isSameRankAsMain
										? "celebration.sameRank"
										: "celebration.mainCelebration",
								)}
							</li>
							<li className="secondary-celebrations__item">
								<button
									className="secondary-celebrations__button"
									onClick={onRestoreCelebration}
								>
									<span
										className="secondary-celebrations__dot"
										style={{
											background:
												// c.liturgical_color_hex ||
												fallbackColor,
										}}
									/>
									<span className="secondary-celebrations__body">
										<span className="secondary-celebrations__name">
											{mainCelebration?.feast_name}
										</span>
										<span className="secondary-celebrations__rank">
											{mainCelebration?.rank_label}
										</span>
									</span>
								</button>
							</li>
						</>
					)}
					{visibleCelebrations.map((c, index) => {
						const sameRank =
							c.rank_precedence ===
							mainCelebration?.rank_precedence;

						const previous = secondaryCelebrations[index - 1];
						const previousSameRank =
							previous?.rank_precedence ===
							mainCelebration?.rank_precedence;

						return (
							<React.Fragment key={c.id}>
								{(index === 0 ||
									sameRank !== previousSameRank) && (
									<li className="secondary-celebrations__heading">
										{sameRank
											? t("celebration.sameRank")
											: t("celebration.lowerRank")}
									</li>
								)}

								<li className="secondary-celebrations__item">
									<button
										className="secondary-celebrations__button"
										onClick={() => onSelectCelebration(c)}
									>
										<span
											className="secondary-celebrations__dot"
											style={{
												background:
													c.liturgical_color_hex ||
													fallbackColor,
											}}
										/>
										<span className="secondary-celebrations__body">
											<span className="secondary-celebrations__name">
												{c.feast_name}
											</span>
											{c.rank_label && (
												<span className="secondary-celebrations__rank">
													{c.rank_label}
												</span>
											)}
										</span>
									</button>
								</li>
							</React.Fragment>
						);
					})}
				</motion.ul>
			)}
		</motion.section>
	);
};

export { SecondaryCelebrations };
