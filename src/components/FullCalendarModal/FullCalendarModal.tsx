import "./FullCalendarModal.css";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { TRANSITIONS } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import {
	addDays,
	addMonths,
	formatYMD,
	getMonthGrid,
	getTodayStr,
	parseYMD,
	startOfMonth,
} from "../../utils/date";

type Props = {
	open: boolean;
	date: string; // YYYY-MM-DD, currently selected
	onClose: () => void;
	onSelect: (date: string) => void;
};

const gridVariants = {
	enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
	center: { opacity: 1, x: 0 },
	exit: (dir: number) => ({ opacity: 0, x: dir * -32 }),
};

// Any Monday; used only to render localized weekday headers.
const A_MONDAY = new Date(2024, 0, 1);

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]';

function Chevron({ dir }: { dir: -1 | 1 }) {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
			<path
				d={dir < 0 ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

const FullCalendarModal = ({ open, date, onClose, onSelect }: Props) => {
	const { languageCode, t } = useLanguage();

	const reduceMotion = useReducedMotion();
	const titleId = useId();
	const today = getTodayStr();

	const [viewMonth, setViewMonth] = useState(() =>
		startOfMonth(parseYMD(date)),
	);
	const [direction, setDirection] = useState(0);
	// Roving tabindex target inside the grid
	const [focused, setFocused] = useState(date);
	// Only steal focus when the change came from the keyboard
	const focusFromKeyboard = useRef(false);

	const dialogRef = useRef<HTMLDivElement>(null);
	const openerRef = useRef<HTMLElement | null>(null);

	// On open: snapshot the opener, reset the view, lock scroll.
	// On close: restore scroll and focus.
	useEffect(() => {
		if (!open) return;
		openerRef.current = document.activeElement as HTMLElement | null;
		setViewMonth(startOfMonth(parseYMD(date)));
		setFocused(date);
		setDirection(0);
		focusFromKeyboard.current = true;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
			openerRef.current?.focus();
		};
	}, [open, date]);

	useEffect(() => {
		if (!open || !focusFromKeyboard.current) return;
		focusFromKeyboard.current = false;
		dialogRef.current
			?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)
			?.focus();
	}, [open, focused, viewMonth]);

	const formats = useMemo(
		() => ({
			month: new Intl.DateTimeFormat(languageCode, {
				month: "long",
				year: "numeric",
			}),
			weekday: new Intl.DateTimeFormat(languageCode, {
				weekday: "short",
			}),
			full: new Intl.DateTimeFormat(languageCode, { dateStyle: "full" }),
		}),
		[languageCode],
	);

	const weekdays = useMemo(
		() =>
			Array.from({ length: 7 }, (_, i) =>
				formats.weekday.format(addDays(A_MONDAY, i)),
			),
		[formats],
	);

	const cells = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);
	const monthKey = formatYMD(viewMonth);

	// If the roving target isn't in the visible grid (after month nav),
	// fall back to the 1st of the month so the grid stays reachable by Tab.
	const tabStop = cells.some((c) => formatYMD(c) === focused)
		? focused
		: monthKey;

	const goMonth = (delta: number) => {
		setDirection(delta);
		setViewMonth((m) => addMonths(m, delta));
	};

	const moveFocus = (target: Date) => {
		const targetMonth = startOfMonth(target);
		if (targetMonth.getTime() !== viewMonth.getTime()) {
			setDirection(targetMonth > viewMonth ? 1 : -1);
			setViewMonth(targetMonth);
		}
		focusFromKeyboard.current = true;
		setFocused(formatYMD(target));
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
			return;
		}

		// Focus trap
		if (e.key === "Tab" && dialogRef.current) {
			const items = Array.from(
				dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
			);
			const first = items[0];
			const last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
			return;
		}

		// Grid navigation only when a day cell has focus
		const cell = (e.target as HTMLElement).dataset.date;
		if (!cell) return;
		const current = parseYMD(cell);

		const byDays: Record<string, number> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -7,
			ArrowDown: 7,
		};
		if (e.key in byDays) {
			e.preventDefault();
			moveFocus(addDays(current, byDays[e.key]));
		} else if (e.key === "PageUp" || e.key === "PageDown") {
			e.preventDefault();
			const delta = e.key === "PageUp" ? -1 : 1;
			const m = addMonths(current, delta);
			const day = Math.min(
				current.getDate(),
				new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(),
			);
			moveFocus(new Date(m.getFullYear(), m.getMonth(), day));
		} else if (e.key === "Home") {
			e.preventDefault();
			moveFocus(parseYMD(today));
		}
	};

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					className="calendar-modal__overlay"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={TRANSITIONS.fast}
					onClick={onClose}
				>
					<motion.div
						ref={dialogRef}
						className="calendar-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						onKeyDown={onKeyDown}
						onClick={(e) => e.stopPropagation()}
						initial={{ opacity: 0, y: 16, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 16, scale: 0.98 }}
						transition={TRANSITIONS.normal}
					>
						<header className="calendar-modal__header">
							<button
								type="button"
								className="calendar-modal__nav"
								onClick={() => goMonth(-1)}
								aria-label="Mois précédent"
							>
								<Chevron dir={-1} />
							</button>
							<h2 id={titleId} className="calendar-modal__title">
								{formats.month.format(viewMonth)}
							</h2>
							<button
								type="button"
								className="calendar-modal__nav"
								onClick={() => goMonth(1)}
								aria-label="Mois suivant"
							>
								<Chevron dir={1} />
							</button>
						</header>

						<div
							className="calendar-modal__weekdays"
							aria-hidden="true"
						>
							{weekdays.map((w) => (
								<span key={w}>{w}</span>
							))}
						</div>

						<div className="calendar-modal__stage">
							<AnimatePresence
								initial={false}
								mode="popLayout"
								custom={direction}
							>
								<motion.div
									key={monthKey}
									className="calendar-modal__grid"
									custom={direction}
									variants={
										reduceMotion ? undefined : gridVariants
									}
									initial="enter"
									animate="center"
									exit="exit"
									transition={TRANSITIONS.normal}
								>
									{cells.map((d) => {
										const dateStr = formatYMD(d);
										const outside =
											d.getMonth() !==
											viewMonth.getMonth();
										const isSelected = dateStr === date;
										const isToday = dateStr === today;
										return (
											<button
												key={dateStr}
												type="button"
												data-date={dateStr}
												className={`calendar-modal__day${outside ? " is-outside" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
												onClick={() =>
													onSelect(dateStr)
												}
												aria-label={formats.full.format(
													d,
												)}
												aria-pressed={isSelected}
												aria-current={
													isToday ? "date" : undefined
												}
												tabIndex={
													dateStr === tabStop ? 0 : -1
												}
											>
												{d.getDate()}
											</button>
										);
									})}
								</motion.div>
							</AnimatePresence>
						</div>

						<footer className="calendar-modal__footer">
							<button
								type="button"
								className="calendar-modal__btn"
								onClick={onClose}
							>
								{t("calendar.close")}
							</button>
							<button
								type="button"
								className="calendar-modal__btn calendar-modal__btn--primary"
								onClick={() => onSelect(today)}
								disabled={date === today}
							>
								{t("calendar.today")}
							</button>
						</footer>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
};

export { FullCalendarModal };
