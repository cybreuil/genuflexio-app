import "./SecondaryCelebrations.css";
import type { Celebration } from "../../types/Celebration";
import { Loader } from "../Loader/Loader";
import { useLanguage } from "../../hooks/useLanguage";
import { AnimatePresence, motion } from "framer-motion";

type SecondaryCelebrationsProps = {
	secondaryCelebrations: Celebration[] | null;
	isLoading: boolean;
	error: Error | null;
	fallbackColor: string;
};

const SecondaryCelebrations = ({
	secondaryCelebrations,
	isLoading,
	error,
	fallbackColor,
}: SecondaryCelebrationsProps) => {
	const { t } = useLanguage();

	return (
		<motion.section className="panel secondary-celebrations" layout="size">
			<motion.h3 className="panel__title" layout="preserve-aspect">
				{t("celebration.otherCelebrations")}
			</motion.h3>

			{isLoading ? (
				<Loader size={32} />
			) : error ? (
				<p className="panel__error">{t("celebration.loadingError")}</p>
			) : !secondaryCelebrations?.length ? (
				<motion.p
					className="panel__empty"
					layout="preserve-aspect"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				>
					{t("celebration.noOtherCelebrations")}
				</motion.p>
			) : (
				<AnimatePresence>
					<motion.ul
						className="secondary-celebrations__list"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{
							duration: 0.6,
						}}
						layout="preserve-aspect"
					>
						{secondaryCelebrations.map((c) => (
							<li
								key={c.id}
								className="secondary-celebrations__item"
							>
								<button className="secondary-celebrations__button">
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
						))}
					</motion.ul>
				</AnimatePresence>
			)}
		</motion.section>
	);
};

export { SecondaryCelebrations };
