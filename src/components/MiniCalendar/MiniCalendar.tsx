import "./MiniCalendar.css";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { FullCalendarModal } from "../FullCalendarModal/FullCalendarModal";
import { CalendarLogo, ResetLogo } from "../../icons";
import { TRANSITIONS } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";
import { useSelectedDate } from "../../hooks/useSelectedDate";
import { addDays, daysBetweenYMD, formatYMD, parseYMD } from "../../utils/date";

/* One strip per selected date, swapped through AnimatePresence.
 *
 * Short move (|delta| ≤ MAX_SLIDE days): the new strip enters offset by
 * `delta` slots, which puts every shared date exactly where it was in the
 * old strip; the old one exits by the same amount. Both move together, so
 * the eye sees a single strip scrolling.
 *
 * Long jump: offset is capped to JUMP_SLOTS and the strips crossfade, which
 * still reads as "coming from the future / the past". */

const VISIBLE = 5;
const RENDER_AROUND = 7; // days on each side of the selection
const MAX_SLIDE = 5; // beyond this many days we crossfade instead
const JUMP_SLOTS = 1.5;
const SPRING = {
	type: "spring",
	stiffness: 260,
	damping: 32,
	mass: 0.9,
} as const;

type Motion = { delta: number; step: number };

function offsetFor({ delta, step }: Motion) {
	const slots =
		Math.abs(delta) <= MAX_SLIDE ? delta : Math.sign(delta) * JUMP_SLOTS;
	return slots * step;
}

const strip = {
	enter: (m: Motion) => ({ x: offsetFor(m), opacity: 0 }),
	center: { x: 0, opacity: 1 },
	exit: (m: Motion) => ({ x: -offsetFor(m), opacity: 0 }),
};

const MiniCalendar = () => {
	const { languageCode, t } = useLanguage();
	const { error } = useCalendar();
	const {
		safeDate: selected,
		today,
		isToday,
		select,
		goToday,
	} = useSelectedDate();
	const reduceMotion = useReducedMotion();

	const [modalOpen, setModalOpen] = useState(false);
	const nativeInputRef = useRef<HTMLInputElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);

	// Slot step (cell width + gap) measured from the DOM; CSS owns sizing.
	const [step, setStep] = useState(0);
	useLayoutEffect(() => {
		const el = viewportRef.current;
		if (!el) return;
		const measure = () => {
			const s = getComputedStyle(el);
			const gap = parseFloat(s.getPropertyValue("--gap")) || 0;
			const inner = el.clientWidth - 2 * parseFloat(s.paddingLeft);
			setStep((inner - (VISIBLE - 1) * gap) / VISIBLE + gap);
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Travel since the previous render: read during render, committed after.
	const prevRef = useRef(selected);
	const delta = daysBetweenYMD(prevRef.current, selected);
	useEffect(() => {
		prevRef.current = selected;
	}, [selected]);
	const motionInfo: Motion = { delta, step };

	const days = useMemo(() => {
		const base = parseYMD(selected);
		return Array.from({ length: RENDER_AROUND * 2 + 1 }, (_, i) =>
			addDays(base, i - RENDER_AROUND),
		);
	}, [selected]);

	const formats = useMemo(
		() => ({
			weekday: new Intl.DateTimeFormat(languageCode, {
				weekday: "short",
			}),
			month: new Intl.DateTimeFormat(languageCode, {
				month: "long",
				year: "numeric",
			}),
			full: new Intl.DateTimeFormat(languageCode, { dateStyle: "full" }),
		}),
		[languageCode],
	);

	// Keyboard: ← → one day, Home = today. Focus follows the selection.
	const refocus = useRef(false);
	const onKeyDown = (e: React.KeyboardEvent) => {
		const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
		if (!d && e.key !== "Home") return;
		e.preventDefault();
		refocus.current = true;
		if (e.key === "Home") goToday();
		else select(formatYMD(addDays(parseYMD(selected), d)));
	};
	useEffect(() => {
		if (!refocus.current) return;
		refocus.current = false;
		viewportRef.current
			?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
			?.focus();
	}, [selected]);

	const openPicker = () => {
		const input = nativeInputRef.current;
		if (window.matchMedia("(max-width: 720px)").matches && input) {
			input.value = selected;
			try {
				input.showPicker();
			} catch {
				input.focus();
				input.click();
			}
			return;
		}
		setModalOpen(true);
	};

	return (
		<div
			className={`panel mini-calendar${error ? " mini-calendar--disabled" : ""}`}
		>
			<div
				ref={viewportRef}
				className="mini-calendar__viewport"
				onKeyDown={onKeyDown}
			>
				<AnimatePresence
					initial={false}
					mode="popLayout"
					custom={motionInfo}
				>
					<motion.div
						key={selected}
						className="mini-calendar__track"
						custom={motionInfo}
						variants={strip}
						initial="enter"
						animate="center"
						exit="exit"
						transition={reduceMotion ? { duration: 0 } : SPRING}
					>
						{days.map((d) => {
							const dateStr = formatYMD(d);
							const isSelected = dateStr === selected;
							const isTodayCell = dateStr === today;
							return (
								<button
									key={dateStr}
									type="button"
									className={`mini-calendar__day${isSelected ? " is-selected" : ""}${isTodayCell ? " is-today" : ""}`}
									onClick={() => select(dateStr)}
									aria-pressed={isSelected}
									aria-current={
										isTodayCell ? "date" : undefined
									}
									aria-label={formats.full.format(d)}
									tabIndex={isSelected ? 0 : -1}
								>
									<span className="mini-calendar__weekday">
										{formats.weekday.format(d)}
									</span>
									<span className="mini-calendar__num">
										{d.getDate()}
									</span>
								</button>
							);
						})}
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="mini-calendar__controls">
				<div className="mini-calendar__slot">
					<AnimatePresence initial={false}>
						{!isToday && (
							<motion.button
								key="reset"
								type="button"
								className="mini-calendar__icon-btn"
								onClick={goToday}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -8 }}
								transition={TRANSITIONS.fast}
								aria-label={t("calendar.backToToday")}
								title={t("calendar.backToToday")}
							>
								<ResetLogo fill="currentColor" />
							</motion.button>
						)}
					</AnimatePresence>
				</div>

				<p className="mini-calendar__month" aria-live="polite">
					{formats.month.format(parseYMD(selected))}
				</p>

				<div className="mini-calendar__slot">
					<button
						type="button"
						className="mini-calendar__icon-btn"
						onClick={openPicker}
						aria-label={t("calendar.pickDate")}
						aria-haspopup="dialog"
						aria-expanded={modalOpen}
						title={t("calendar.pickDate")}
					>
						<CalendarLogo fill="currentColor" />
					</button>
				</div>

				<input
					ref={nativeInputRef}
					type="date"
					className="mini-calendar__native"
					tabIndex={-1}
					aria-hidden="true"
					onChange={(e) => e.target.value && select(e.target.value)}
				/>
			</div>

			<FullCalendarModal
				open={modalOpen}
				date={selected}
				onClose={() => setModalOpen(false)}
				onSelect={(d) => {
					setModalOpen(false);
					select(d);
				}}
			/>
		</div>
	);
};

export { MiniCalendar };
