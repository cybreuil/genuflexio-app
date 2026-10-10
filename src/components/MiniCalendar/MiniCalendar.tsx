import "./MiniCalendar.css";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
	AnimatePresence,
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
} from "framer-motion";

import { FullCalendarModal } from "../FullCalendarModal/FullCalendarModal";
import { CalendarLogo, ResetLogo } from "../../icons";
import { TRANSITIONS } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";
import { useSelectedDate } from "../../hooks/useSelectedDate";
import { addDays, daysBetweenYMD, formatYMD, parseYMD } from "../../utils/date";

/* The strip is always rendered centred on the selected day. Cells are keyed by
 * date, so on a change React keeps the shared ones and mounts the new edge
 * ones under the mask. We then FLIP the track: it jumps by the distance the
 * cells moved in the DOM (so nothing moves on screen) and springs back to 0.
 * Beyond RENDER_AROUND days, the strip is replaced with a directional fade. */

const VISIBLE = 5;
const RENDER_AROUND = 7; // > floor(VISIBLE / 2) + 1 so edges stay covered
const SPRING = {
	type: "spring",
	stiffness: 260,
	damping: 32,
	mass: 0.9,
} as const;

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
	const stepRef = useRef(0);
	useLayoutEffect(() => {
		const el = viewportRef.current;
		if (!el) return;
		const measure = () => {
			const styles = getComputedStyle(el);
			const gap = parseFloat(styles.getPropertyValue("--gap")) || 0;
			const inner = el.clientWidth - 2 * parseFloat(styles.paddingLeft);
			stepRef.current = (inner - (VISIBLE - 1) * gap) / VISIBLE + gap;
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const days = useMemo(() => {
		const base = parseYMD(selected);
		return Array.from({ length: RENDER_AROUND * 2 + 1 }, (_, i) =>
			addDays(base, i - RENDER_AROUND),
		);
	}, [selected]);

	// FLIP on selection change. `prev` is read during the layout phase, before
	// the browser paints the recentred strip.
	const x = useMotionValue(0);
	const prevRef = useRef(selected);
	// Direction of the last long jump, drives the strip swap animation.
	const [jump, setJump] = useState<{ key: string; dir: number }>({
		key: selected,
		dir: 0,
	});

	useLayoutEffect(() => {
		const delta = daysBetweenYMD(prevRef.current, selected);
		prevRef.current = selected;
		if (delta === 0) return;

		if (Math.abs(delta) > RENDER_AROUND - 2) {
			// Too far: swap the whole strip with a directional fade.
			setJump({ key: selected, dir: Math.sign(delta) });
			x.jump(0);
			return;
		}

		if (reduceMotion) return;
		// Cells moved -delta slots in the DOM; offset the track so they appear
		// where they were, then spring to the new resting position.
		x.jump(delta * stepRef.current);
		const controls = animate(x, 0, SPRING);
		return () => controls.stop();
	}, [selected, reduceMotion, x]);

	const stripSwap = {
		enter: (dir: number) => ({
			x: dir * 1.5 * stepRef.current,
			opacity: 0,
		}),
		center: { x: 0, opacity: 1 },
		exit: (dir: number) => ({
			x: -dir * 1.5 * stepRef.current,
			opacity: 0,
		}),
	};

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
		const delta =
			e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
		if (!delta && e.key !== "Home") return;
		e.preventDefault();
		refocus.current = true;
		if (e.key === "Home") goToday();
		else select(formatYMD(addDays(parseYMD(selected), delta)));
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
					custom={jump.dir}
				>
					{/* Outer layer: swapped on long jumps (directional fade) */}
					<motion.div
						key={jump.key}
						className="mini-calendar__strip"
						custom={jump.dir}
						variants={reduceMotion ? undefined : stripSwap}
						initial="enter"
						animate="center"
						exit="exit"
						transition={reduceMotion ? { duration: 0 } : SPRING}
					>
						{/* Inner layer: FLIP-translated on short moves */}
						<motion.div
							className="mini-calendar__track"
							style={{ x }}
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
