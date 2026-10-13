import "./ArtworkLightbox.css";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Image } from "../../types/Image";
import { periodLabel, periodOf } from "../../utils/artworkFormat";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
	items: Image[];
	index: number;
	onIndexChange: (i: number) => void;
	onClose: () => void;
};

export function ArtworkLightbox({
	items,
	index,
	onIndexChange,
	onClose,
}: Props) {
	const image = items[index];
	const [zoomed, setZoomed] = useState(false);
	const [showCartel, setShowCartel] = useState(true);
	const [direction, setDirection] = useState(0);

	const go = useCallback(
		(delta: number) => {
			if (items.length < 2) return;
			setDirection(delta);
			setZoomed(false);
			onIndexChange((index + delta + items.length) % items.length);
		},
		[index, items.length, onIndexChange],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") zoomed ? setZoomed(false) : onClose();
			if (e.key === "ArrowRight") go(1);
			if (e.key === "ArrowLeft") go(-1);
			if (e.key === "i" || e.key === "I") setShowCartel((s) => !s);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [go, onClose, zoomed]);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	// Préchargement des voisines
	useEffect(() => {
		[1, -1].forEach((d) => {
			const n = items[(index + d + items.length) % items.length];
			if (n) {
				const img = new window.Image();
				img.src = n.image_url;
			}
		});
	}, [index, items]);

	if (!image) return null;

	const period = periodOf(image);

	return createPortal(
		<motion.div
			className={`lightbox${zoomed ? " lightbox--zoomed" : ""}${showCartel ? "" : " lightbox--no-cartel"}`}
			role="dialog"
			aria-modal="true"
			aria-label={image.title}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* fond flouté de l'œuvre : ambiance "salle" */}
			<AnimatePresence mode="popLayout">
				<motion.div
					key={`bg-${image.id}`}
					className="lightbox__ambient"
					style={{ backgroundImage: `url(${image.image_url})` }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.8 }}
					aria-hidden="true"
				/>
			</AnimatePresence>

			{/* --- Toolbar --- */}
			<header className="lightbox__bar">
				<span className="lightbox__counter">
					{index + 1} <span aria-hidden="true">/</span> {items.length}
				</span>
				<div className="lightbox__actions">
					<button
						type="button"
						className="lightbox__icon"
						onClick={() => setShowCartel((s) => !s)}
						aria-pressed={showCartel}
						aria-label="Afficher le cartel (i)"
						title="Cartel (i)"
					>
						i
					</button>
					<button
						type="button"
						className="lightbox__icon"
						onClick={() => setZoomed((z) => !z)}
						aria-pressed={zoomed}
						aria-label={zoomed ? "Réduire" : "Agrandir"}
						title="Zoom"
					>
						{zoomed ? "−" : "+"}
					</button>
					<button
						type="button"
						className="lightbox__icon lightbox__icon--close"
						onClick={onClose}
						aria-label="Fermer (Échap)"
						title="Fermer (Échap)"
					>
						×
					</button>
				</div>
			</header>

			{/* --- Stage --- */}
			<div
				className="lightbox__stage"
				onClick={() => zoomed && setZoomed(false)}
			>
				<AnimatePresence
					mode="popLayout"
					custom={direction}
					initial={false}
				>
					<motion.img
						key={image.id}
						className="lightbox__image"
						src={image.image_url}
						alt={image.alt_text || image.title}
						decoding="async"
						draggable={false}
						custom={direction}
						variants={{
							enter: (d: number) => ({
								opacity: 0,
								x: d * 60,
								scale: 0.98,
							}),
							center: { opacity: 1, x: 0, scale: 1 },
							exit: (d: number) => ({
								opacity: 0,
								x: d * -60,
								scale: 0.98,
							}),
						}}
						initial="enter"
						animate="center"
						exit="exit"
						transition={{ duration: 0.45, ease: EASE }}
						drag={items.length > 1 && !zoomed ? "x" : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.2}
						onDragEnd={(_, info) => {
							if (info.offset.x < -80) go(1);
							else if (info.offset.x > 80) go(-1);
						}}
						onClick={(e) => {
							e.stopPropagation();
							setZoomed((z) => !z);
						}}
					/>
				</AnimatePresence>

				{items.length > 1 && (
					<>
						<button
							type="button"
							className="lightbox__nav lightbox__nav--prev"
							onClick={(e) => {
								e.stopPropagation();
								go(-1);
							}}
							aria-label="Œuvre précédente"
						>
							←
						</button>
						<button
							type="button"
							className="lightbox__nav lightbox__nav--next"
							onClick={(e) => {
								e.stopPropagation();
								go(1);
							}}
							aria-label="Œuvre suivante"
						>
							→
						</button>
					</>
				)}
			</div>

			{/* --- Cartel --- */}
			<AnimatePresence initial={false}>
				{showCartel && (
					<motion.aside
						key={`cartel-${image.id}`}
						className="lightbox__cartel"
						initial={{ opacity: 0, x: 24 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 24 }}
						transition={{ duration: 0.4, ease: EASE }}
					>
						{image.saints?.map((saint, index) => (
							<span
								className="lightbox__eyebrow"
								key={`${saint.slug}-${index}`}
							>
								{saint.slug ? (
									<Link
										to={`/saints/${saint.slug}`}
										onClick={onClose}
									>
										{saint.name} →
									</Link>
								) : (
									saint.name
								)}
							</span>
						))}

						<h2 className="lightbox__title">{image.title}</h2>
						{image.creator && (
							<p className="lightbox__artist">{image.creator}</p>
						)}

						<dl className="lightbox__facts">
							{image.date_label && (
								<div>
									<dt>Date</dt>
									<dd>
										{image.date_label}
										{period && (
											<span className="lightbox__muted">
												{" "}
												· {periodLabel(period)}
											</span>
										)}
									</dd>
								</div>
							)}
							{image.repository && (
								<div>
									<dt>Conservation</dt>
									<dd>{image.repository}</dd>
								</div>
							)}
							{image.image_type && (
								<div>
									<dt>Type</dt>
									<dd>{image.image_type}</dd>
								</div>
							)}
						</dl>

						{image.caption && (
							<p className="lightbox__caption">{image.caption}</p>
						)}

						<footer className="lightbox__credit">
							{image.credit && <span>{image.credit}</span>}
							{image.license && <span>{image.license}</span>}
							{image.source_url && (
								<a
									href={image.source_url}
									target="_blank"
									rel="noreferrer"
								>
									Source ↗
								</a>
							)}
						</footer>
					</motion.aside>
				)}
			</AnimatePresence>
		</motion.div>,
		document.body,
	);
}
