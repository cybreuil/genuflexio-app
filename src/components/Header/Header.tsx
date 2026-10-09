import "./Header.css";
import { Logo } from "../Logo/Logo";
import { Link, useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TRANSITIONS, EASINGS } from "../../styles/theme";
import { useState, useEffect } from "react";
import { BurgerIcon } from "../BurgerIcon/BurgerIcon";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import { LanguageDropDown } from "../LanguageDropDown/LanguageDropDown";
import type { NavItem } from "../../types/NavItem";
import { useLanguage } from "../../hooks/useLanguage";

const NAV_ITEMS: NavItem[] = [
	// { to: "/", labelKey: "nav.home", end: true },
	{ to: "/celebration", labelKey: "nav.celebration" },
	{ to: "/saints", labelKey: "nav.saints" },
	{ to: "/gallery", labelKey: "nav.gallery" },
	// { to: "/search", labelKey: "nav.search" },
	{ to: "/about", labelKey: "nav.about" },
	{ to: "/404", labelKey: "nav.404" },
];

// Scroll Actions
// Past this offset the header becomes compact and translucent.
// Has to be sync to the disappearence in hero
const SCROLL_THRESHOLD = 50;
// Below this offset the header is never hidden, so the top of the page stays reachable
const HIDE_THRESHOLD = 500;
/** Scroll jitter smaller than this is ignored when deciding the direction */
const DIRECTION_DEADZONE = 6;

// Menu animation
const menuOverlay = {
	hidden: {
		opacity: 0,
		transition: { duration: 0.25, ease: EASINGS.standard },
	},
	show: { opacity: 1, transition: { duration: 0.3, ease: EASINGS.standard } },
};

const menuList = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const menuItem = {
	hidden: { opacity: 0, y: 24, transition: { duration: 0.15 } },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: EASINGS.out },
	},
};

const menuFooter = {
	hidden: { opacity: 0, y: 16, transition: { duration: 0.15 } },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, delay: 0.45, ease: EASINGS.out },
	},
};

const Header = () => {
	const { t } = useLanguage();

	const { pathname } = useLocation();
	const isHomePage = pathname === "/";

	const [isScrolled, setIsScrolled] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isHidden, setIsHidden] = useState(false);

	// burger wave
	// const [showBurgerWave, setShowBurgerWave] = useState(false);
	// useEffect(() => {
	// 	// petit délai pour laisser l'animation d'apparition du header se terminer
	// 	const t = setTimeout(() => setShowBurgerWave(true), 1000);
	// 	return () => clearTimeout(t);
	// }, []);

	// On ecoute le scroll pour ajouter une classe "scrolled" au header lorsque l'utilisateur a scrollé de plus de 50px
	// Update : better scroll performance with requestAnimationFrame and ticking
	// Compact past a threshold; hide while scrolling down, reveal on scroll up
	useEffect(() => {
		let lastY = window.scrollY;
		let ticking = false;

		const update = () => {
			const y = window.scrollY;
			setIsScrolled(y > SCROLL_THRESHOLD);

			const delta = y - lastY;
			if (Math.abs(delta) > DIRECTION_DEADZONE) {
				setIsHidden(y > HIDE_THRESHOLD && delta > 0);
				lastY = y;
			}
			ticking = false;
		};

		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(update);
		};

		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// Close the menu whenever the route changes
	useEffect(() => {
		setIsMenuOpen(false);
	}, [pathname]);

	// Not used right now
	// While the menu is open: lock the page scroll and close on Escape
	useEffect(() => {
		if (!isMenuOpen) return;

		document.body.classList.add("no-scroll");
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsMenuOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.classList.remove("no-scroll");
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [isMenuOpen]);

	// At the top of the home page the bar sits on the dark hero: light text, no surface
	const isOnHero = isHomePage && !isScrolled && !isMenuOpen;
	// On the home page the hero owns the title until the user scrolls
	const showWordmark = !isHomePage || isScrolled;

	// CSS handling for the header, based on scroll state, menu state, and hero state
	const headerClassName = [
		"header",
		isScrolled && "header--scrolled",
		isHidden && !isMenuOpen && "header--hidden",
		isOnHero && "header--on-hero",
		isMenuOpen && "header--menu-open",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<>
			{/*On utilisait ca quand on partait du reduit pour le plus large au scroll
		Et qu'on avait donc besoin d'un mask intiallement*/}
			{/*<motion.div
				className={`header-gap-mask`}
				initial={{ height: "var(--initial-blur-height)" }}
				animate={{
					height: isScrolled
						? "var(--header-height)"
						: "var(--initial-blur-height)",
				}}
				transition={TRANSITIONS.normal}
			/>*/}
			<header className={headerClassName}>
				<motion.div
					className="header__main"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={TRANSITIONS.slower}
				>
					<Link
						to="/"
						className="header__brand"
						aria-label="Genuflexio"
					>
						<span className="header__logo" aria-hidden="true">
							<Logo color="currentColor" />
						</span>
						<AnimatePresence>
							{showWordmark && (
								<motion.span
									className="header__wordmark"
									// Not using layout Animation anymore
									// layoutId="website-title"
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{
										opacity: 0,
										x: -10,
										transition: {
											duration: 0.5,
											delay: 0,
											ease: EASINGS.out,
										},
									}}
									transition={{
										duration: 0.5,
										delay: 0.2,
										ease: EASINGS.out,
									}}
									// WIP
									// transition={{TRANSITIONS.normal}}
								>
									Genuflexio
								</motion.span>
							)}
						</AnimatePresence>
					</Link>

					<nav className="header__nav" aria-label={t("nav.main")}>
						{NAV_ITEMS.map(({ to, labelKey, end }) => (
							<NavLink
								key={to}
								to={to}
								end={end}
								className="header__link"
							>
								{({ isActive }) => (
									<>
										{t(labelKey)}

										{isActive && (
											<motion.span
												className="header__active-dot"
												layoutId="header-active-dot"
												// 2 heures a trouver "layout = x" jpp c'est parfait
												layout="x"
												transition={{
													type: "spring",
													stiffness: 500,
													damping: 35,
												}}
											/>
										)}
									</>
								)}
							</NavLink>
						))}
					</nav>
					<div className="header__tools">
						<div className="header__tools-desktop">
							<LanguageDropDown />
							<ThemeToggle />
						</div>
						<BurgerIcon
							isOpen={isMenuOpen}
							onClick={() => setIsMenuOpen((open) => !open)}
						/>
					</div>
				</motion.div>
			</header>
			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						className="header-menu"
						role="dialog"
						aria-modal="true"
						aria-label={t("nav.main")}
						variants={menuOverlay}
						initial="hidden"
						animate="show"
						exit="hidden"
					>
						<motion.nav
							className="header-menu__nav"
							variants={menuList}
						>
							{NAV_ITEMS.map(({ to, labelKey, end }, index) => (
								<motion.div key={to} variants={menuItem}>
									<NavLink
										to={to}
										end={end}
										className="header-menu__link"
									>
										<span className="header-menu__index">
											{String(index + 1).padStart(2, "0")}
										</span>
										{t(labelKey)}
									</NavLink>
								</motion.div>
							))}
						</motion.nav>

						<motion.div
							className="header-menu__footer"
							variants={menuFooter}
						>
							<a
								href="https://github.com/cybreuil"
								target="_blank"
								rel="noopener noreferrer"
							>
								GitHub
							</a>
							<a href="mailto:cybreuil@gmail.com">
								{t("nav.contact")}
							</a>
							<div className="header-menu__tools">
								<LanguageDropDown />
								<ThemeToggle />
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export { Header };
