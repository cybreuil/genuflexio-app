import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FullCalendarModal } from "../FullCalendarModal/FullCalendarModal";
import { motion } from "framer-motion";
import { TRANSITIONS } from "../../styles/theme";
import "./MiniCalendar.css";
import {
	formatYMD,
	parseYMD,
	getTodayStr,
	daysBetweenYMD,
} from "../../utils/date";
import { CalendarLogo, ResetLogo } from "../../icons";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";

// Version 5 jours (autour de la date sélectionnée)
// const get5WeekDays = (date = new Date()) => {
// 	const start = new Date(date);
// 	start.setDate(date.getDate() - 2); // 2 jours avant
// 	return Array.from({ length: 5 }, (_, i) => {
// 		const d = new Date(start);
// 		d.setDate(start.getDate() + i);
// 		return d;
// 	});
// };

// On prend finalement 9 jours (5 +4 buffers - 2 de chaque coté pour garder une bonne visibilité du contexte)
// Version 9 jours
const get9DaysWithBuffer = (date = new Date()) => {
	const start = new Date(date);
	start.setDate(date.getDate() - 4); // 4 jours avant
	return Array.from({ length: 9 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return d;
	});
};

const MiniCalendar = () => {
	const navigate = useNavigate();
	const [isAnimating, setIsAnimating] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// On recupere la langue du context pour l'affichage des jours de la semaine et du mois
	const { languageCode } = useLanguage();

	const { error } = useCalendar();

	// Récupère la date sélectionnée depuis la query string (?date=YYYY-MM-DD)
	// const params = new URLSearchParams(location.search);
	// const selectedDate = params.get("date") || getTodayStr();

	// On recupere la date depuis le param finalement !
	const { date } = useParams<{ date: string }>();
	const todayStr = getTodayStr();
	let selectedDate = "";
	if (
		date &&
		!/^\d{4}-\d{2}-\d{2}$/.test(date) &&
		isNaN(parseYMD(date).getTime())
	) {
		// Si la date n'est pas au format YYYY-MM-DD ou n'est pas une date valide, on ignore et on utilise aujourd'hui
		console.warn(
			"Date invalide dans l'URL, utilisation de la date du jour",
		);
		selectedDate = todayStr;
	} else {
		selectedDate = date || todayStr;
	}

	// const weekDays = useMemo(
	// 	() => getWeekDays(new Date(selectedDate)),
	// 	[selectedDate],
	// );

	// 9 jours avec buffer
	const bufferedDays = useMemo(
		() => get9DaysWithBuffer(parseYMD(selectedDate)),
		[selectedDate],
	);

	// Month for minicalendar
	const selectedMonthLabel = useMemo(() => {
		try {
			const d = parseYMD(selectedDate); // parseYMD est déjà importé
			const locale = languageCode || "en - US";
			return d.toLocaleDateString(locale, {
				month: "long",
				year: "numeric",
			});
		} catch {
			return "";
		}
	}, [selectedDate, languageCode]);

	// On gere le calendrier date picker
	const inputRef = useRef<HTMLInputElement>(null);
	const handleIconClick = () => {
		// prefer native picker on small screens
		if (
			window.matchMedia &&
			window.matchMedia("(max-width: 720px)").matches
		) {
			if (inputRef.current) {
				inputRef.current.showPicker
					? inputRef.current.showPicker()
					: inputRef.current.focus();
			}
			return;
		}
		setIsModalOpen(true);
	};

	//Definition de l'ordre de defilement
	const [prevDate, setPrevDate] = useState(selectedDate);

	const direction = useMemo(() => {
		if (!prevDate) return 0;
		const diffDays = daysBetweenYMD(prevDate, selectedDate);
		// diffDays > 0 : glisse vers la droite, < 0 : vers la gauche
		return diffDays;
	}, [selectedDate, prevDate]);

	const handleDayClick = (dateStr: string) => {
		if (isAnimating) return;

		setIsAnimating(true);
		setPrevDate(selectedDate);
		navigate(`/celebration/${dateStr}`);

		setTimeout(() => {
			setIsAnimating(false);
		}, 10); // Durée du délai pour éviter les clics rapides
	};

	const handleCalendarModalDayClick = (dateStr: string) => {
		setIsModalOpen(false);
		setPrevDate(selectedDate);
		navigate(`/celebration/${dateStr}`);
	};

	// Previous weekDays
	// const [prevWeekDays, setPrevWeekDays] = useState<string[]>(
	// 	weekDays.map((d) => formatDate(d)),
	// );
	// useEffect(() => {
	// 	setPrevWeekDays(weekDays.map((d) => formatDate(d)));
	// }, [selectedDate]);

	return (
		<div
			className={`panel mini-calendar-container ${error ? "panel__error mini-calendar-container__disabled" : ""}`}
		>
			<div className="mini-calendar-viewport">
				<div className="mini-calendar-wrapper">
					<motion.div
						className="mini-calendar-track"
						// J'ai l'impression qu'on peut s'en passer
						// layout
					>
						{bufferedDays.map((d) => {
							const dateStr = formatYMD(d);
							const isSelected = dateStr === selectedDate;
							const isToday = dateStr === todayStr;
							const slideX =
								direction > 0 ? 50 : direction < 0 ? -50 : 0;

							return (
								<motion.button
									key={dateStr}
									layout="x"
									layoutId={`mini-calendar-day-${dateStr}`}
									className={`mini-calendar-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
									onClick={() => handleDayClick(dateStr)}
									aria-current={
										isSelected ? "date" : undefined
									}
									initial={{
										opacity: 0,
										x: slideX,
									}}
									animate={
										isToday && !isSelected
											? { opacity: 0.5, x: 0 }
											: { opacity: 1, x: 0 }
									}
									// exit={{ opacity: 0, x: slideX }}
									transition={TRANSITIONS.normal}
								>
									<span className="mini-calendar-day-label">
										{d.toLocaleDateString(
											languageCode || "en-US",
											{
												weekday: "short",
											},
										)}
									</span>
									<span className="mini-calendar-day-num">
										{d.getDate()}
									</span>
								</motion.button>
							);
						})}
					</motion.div>
				</div>
			</div>
			<motion.div className="mini-calendar-controls">
				{selectedDate !== todayStr && (
					<motion.button
						className="calendar-reset-button"
						onClick={() => handleDayClick(todayStr)}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -10 }}
						transition={TRANSITIONS.normal}
						aria-label="Revenir à aujourd'hui"
						title="Revenir à aujourd'hui"
					>
						<ResetLogo fill="var(--color-text-secondary)" />
					</motion.button>
				)}

				<motion.p className="mini-calendar-month-label">
					{selectedMonthLabel}
				</motion.p>

				<motion.div className="mini-calendar-date-picker" layout="x">
					<button
						type="button"
						className="calendar-emoji-btn"
						onClick={handleIconClick}
						aria-label="Choisir une date"
						title="Choisir une date"
					>
						<CalendarLogo fill="var(--color-text-secondary)" />
					</button>
					<input
						ref={inputRef}
						type="date"
						style={{
							display: "none",
						}}
						onChange={(e) => {
							if (e.target.value) {
								handleDayClick(e.target.value);
							}
						}}
					/>
				</motion.div>
			</motion.div>
			<FullCalendarModal
				initialDate={selectedDate}
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSelect={(dateStr) => handleCalendarModalDayClick(dateStr)}
			/>
		</div>
	);
};

export { MiniCalendar };
