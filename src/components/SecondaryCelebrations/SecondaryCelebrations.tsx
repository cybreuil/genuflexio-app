import "./SecondaryCelebrations.css";
import type { Celebration } from "../../types/Celebration";
import { Loader } from "../Loader/Loader";
import { useLanguage } from "../../hooks/useLanguage";
import { motion } from "framer-motion";
import { TRANSITIONS } from "../../styles/theme";

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
		<motion.section className="panel secondary-celebrations" layout>
			<motion.h3 className="panel__title" layout="position">
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
				>
					{secondaryCelebrations.map((c) => (
						<li key={c.id} className="secondary-celebrations__item">
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
			)}
		</motion.section>
	);
};

export { SecondaryCelebrations };
