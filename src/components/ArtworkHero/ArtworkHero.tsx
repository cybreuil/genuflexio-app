import { useMemo, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRandomImages } from "../../hooks/useImages";
import type { Image } from "../../types/Image";
import "./ArtworkHero.css";
import { motion, useScroll, useTransform } from "framer-motion";

import { DesignedLogo } from "../../icons";

const ROWS = 2;
const TILES_PER_ROW = 10;

interface ArtworkHeroProps {
	title: string;
	eyebrow?: string;
	description?: string;
	children?: ReactNode;
}

/**
 * Interleaves the images into `rows` rows and cycles them so that every row
 * has at least `perRow` tiles — enough to cover any viewport width even when
 * the API returns fewer images than requested.
 */
function buildRows(images: Image[], rows: number, perRow: number): Image[][] {
	if (images.length === 0) return [];

	const total = Math.max(rows * perRow, images.length);
	const pool = Array.from(
		{ length: total },
		(_, i) => images[i % images.length],
	);

	return Array.from({ length: rows }, (_, row) =>
		pool.filter((_, i) => i % rows === row),
	);
}

function ArtworkTile({ image }: { image: Image }) {
	const [loaded, setLoaded] = useState(false);

	return (
		<figure
			className={`artwork-hero__tile${loaded ? " artwork-hero__tile--loaded" : ""}`}
		>
			<img
				src={image.image_url}
				alt=""
				draggable={false}
				decoding="async"
				onLoad={() => setLoaded(true)}
			/>
		</figure>
	);
}

function ArtworkHero({
	title,
	eyebrow,
	description,
	children,
}: ArtworkHeroProps) {
	// The backdrop is purely decorative: loading and error states are ignored
	// so the title and actions are always rendered immediately.
	const { images } = useRandomImages(ROWS * TILES_PER_ROW);

	const rows = useMemo(
		() => buildRows(images, ROWS, TILES_PER_ROW),
		[images],
	);

	// Using useScroll to fade
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end start"],
	});
	// const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
	const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
	const filter = useTransform(
		scrollYProgress,
		[0, 0.3],
		["blur(0px)", "blur(2px)"],
	);

	// isScrolled for title cancel
	const [isScrolled, setIsScrolled] = useState(false);
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<section className="artwork-hero" ref={containerRef}>
			{rows.length > 0 && (
				<div className="artwork-hero__backdrop" aria-hidden="true">
					{rows.map((row, rowIndex) => (
						<div key={rowIndex} className="artwork-hero__row">
							{/* The row is rendered twice so the marquee loops seamlessly. */}
							<div className="artwork-hero__track">
								{[...row, ...row].map((image, index) => (
									<ArtworkTile
										key={`${image.id}-${index}`}
										image={image}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			<div className="artwork-hero__overlay" aria-hidden="true" />

			<motion.div
				className="artwork-hero__content"
				style={{ opacity, filter }}
			>
				{eyebrow && (
					<motion.span
						className="artwork-hero__eyebrow"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						{eyebrow}
					</motion.span>
				)}
				{/*{!isScrolled ? (*/}
				<motion.h1
					className="artwork-hero__title"
					// initial={{ opacity: 0, y: -20 }}
					// animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					// layoutId="website-title"
				>
					<DesignedLogo title="Saints" width={200} height={200} />
					enuflexio
				</motion.h1>
				{/*) : (*/}
				{/*<h1
						className="artwork-hero__title"
						style={{ opacity: 0, pointerEvents: "none" }}
					>
						{title}
					</h1>
				)}*/}
				{description && (
					<motion.p
						className="artwork-hero__description"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5, delay: 0.4 }}
					>
						{description}
					</motion.p>
				)}
				{children && (
					<motion.div
						className="artwork-hero__actions"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							duration: 1,
							delay: 1,
						}}
					>
						{children}
					</motion.div>
				)}
			</motion.div>
		</section>
	);
}

export { ArtworkHero };
export type { ArtworkHeroProps };
