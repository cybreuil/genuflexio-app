import "./PurgeVisits.css";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { purgeVisits } from "../../api/analytics";
import type { VisitsRange } from "../../types/Analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Durée d'appui nécessaire pour confirmer "Tout effacer". */
const HOLD_MS = 1200;

const OPTIONS: { value: VisitsRange; label: string; hint: string }[] = [
	{
		value: "90d",
		label: "+ de 90 jours",
		hint: "Conserve les 3 derniers mois",
	},
	{ value: "30d", label: "+ de 30 jours", hint: "Conserve le dernier mois" },
	{
		value: "7d",
		label: "+ de 7 jours",
		hint: "Conserve la dernière semaine",
	},
	{
		value: "all",
		label: "Tout effacer",
		hint: "Supprime l'intégralité du journal",
	},
];

type Status =
	| { kind: "idle" }
	| { kind: "working" }
	| { kind: "done"; deleted: number }
	| { kind: "error"; message: string };

type Props = {
	/** Appelé après une purge réussie pour recharger stats + journal. */
	onPurged?: () => void;
};

export function PurgeVisits({ onPurged }: Props) {
	const [open, setOpen] = useState(false);
	const [choice, setChoice] = useState<VisitsRange>("90d");
	const [status, setStatus] = useState<Status>({ kind: "idle" });

	// Appui long pour "all"
	const [holding, setHolding] = useState(false);
	const holdTimer = useRef<number | null>(null);

	const destructive = choice === "all";
	const busy = status.kind === "working";

	const clearHold = () => {
		if (holdTimer.current) window.clearTimeout(holdTimer.current);
		holdTimer.current = null;
		setHolding(false);
	};

	useEffect(() => clearHold, []);

	// Fermeture → reset doux après l'animation
	useEffect(() => {
		if (open) return;
		const t = window.setTimeout(() => {
			setStatus({ kind: "idle" });
			setChoice("90d");
		}, 300);
		return () => window.clearTimeout(t);
	}, [open]);

	const run = async () => {
		if (busy) return;
		setStatus({ kind: "working" });
		try {
			const res = await purgeVisits(choice);
			setStatus({ kind: "done", deleted: res.deleted });
			onPurged?.();
		} catch (err) {
			setStatus({
				kind: "error",
				message:
					err instanceof Error
						? err.message
						: "La purge a échoué. Réessayez.",
			});
		}
	};

	// Clic simple pour les plages datées, appui long pour "all"
	const onPressStart = () => {
		if (busy || !destructive) return;
		setHolding(true);
		holdTimer.current = window.setTimeout(() => {
			clearHold();
			void run();
		}, HOLD_MS);
	};

	const onClick = () => {
		if (busy || destructive) return;
		void run();
	};

	return (
		<div className={`purge${open ? " purge--open" : ""}`}>
			<button
				type="button"
				className="purge__toggle"
				aria-expanded={open}
				aria-controls="purge-panel"
				onClick={() => setOpen((v) => !v)}
			>
				<svg
					className="purge__icon"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
				</svg>
				Purger le journal
				<span className="purge__chevron" aria-hidden="true">
					›
				</span>
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						id="purge-panel"
						className="purge__panel"
						initial={{ opacity: 0, height: 0, y: -6 }}
						animate={{ opacity: 1, height: "auto", y: 0 }}
						exit={{ opacity: 0, height: 0, y: -6 }}
						transition={{ duration: 0.35, ease: EASE }}
					>
						<div className="purge__inner">
							<p className="purge__lead">
								Supprime définitivement les visites plus
								anciennes que la période choisie. Cette action
								est irréversible.
							</p>

							<div
								className="purge__options"
								role="radiogroup"
								aria-label="Ancienneté à supprimer"
							>
								{OPTIONS.map((o) => {
									const active = choice === o.value;
									const danger = o.value === "all";
									return (
										<button
											key={o.value}
											type="button"
											role="radio"
											aria-checked={active}
											disabled={busy}
											className={[
												"purge__option",
												active &&
													"purge__option--active",
												danger &&
													"purge__option--danger",
											]
												.filter(Boolean)
												.join(" ")}
											onClick={() => {
												setChoice(o.value);
												if (status.kind !== "working")
													setStatus({ kind: "idle" });
											}}
										>
											<span className="purge__option-label">
												{o.label}
											</span>
											<span className="purge__option-hint">
												{o.hint}
											</span>
										</button>
									);
								})}
							</div>

							<div className="purge__actions">
								<button
									type="button"
									className={[
										"purge__confirm",
										destructive && "purge__confirm--danger",
										holding && "purge__confirm--holding",
									]
										.filter(Boolean)
										.join(" ")}
									disabled={busy || status.kind === "done"}
									onClick={onClick}
									onPointerDown={onPressStart}
									onPointerUp={clearHold}
									onPointerLeave={clearHold}
									onPointerCancel={clearHold}
									onKeyDown={(e) => {
										if (
											destructive &&
											(e.key === "Enter" || e.key === " ")
										) {
											e.preventDefault();
											if (!holding) onPressStart();
										}
									}}
									onKeyUp={clearHold}
									style={
										{
											"--hold-ms": `${HOLD_MS}ms`,
										} as React.CSSProperties
									}
								>
									<span className="purge__confirm-fill" />
									<span className="purge__confirm-label">
										{busy
											? "Suppression…"
											: destructive
												? holding
													? "Maintenez…"
													: "Maintenir pour tout effacer"
												: `Supprimer ${OPTIONS.find((o) => o.value === choice)?.label.toLowerCase()}`}
									</span>
								</button>

								<button
									type="button"
									className="purge__cancel"
									disabled={busy}
									onClick={() => setOpen(false)}
								>
									{status.kind === "done"
										? "Fermer"
										: "Annuler"}
								</button>
							</div>

							<AnimatePresence mode="wait">
								{status.kind === "done" && (
									<motion.p
										key="done"
										className="purge__feedback purge__feedback--ok"
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										role="status"
									>
										✓{" "}
										{status.deleted === 0
											? "Rien à supprimer sur cette période."
											: `${status.deleted.toLocaleString("fr-FR")} visite${status.deleted > 1 ? "s" : ""} supprimée${status.deleted > 1 ? "s" : ""}.`}
									</motion.p>
								)}
								{status.kind === "error" && (
									<motion.p
										key="error"
										className="purge__feedback purge__feedback--error"
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										role="alert"
									>
										{status.message}
									</motion.p>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
