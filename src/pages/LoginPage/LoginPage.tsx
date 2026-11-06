import "./LoginPage.css";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { variantUrl } from "../../utils/imageUrl";

// Components
import { Loader } from "../../components/Loader/Loader";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useRandomImages } from "../../hooks/useImages";

// Types
import { ApiError } from "../../api/client";

/* ===== Animation presets ===== */

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
	hidden: { opacity: 0, y: 24 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const stagger = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const LoginPage = () => {
	const { t } = useLanguage();
	const { user, isAuthLoading, login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const { images } = useRandomImages(1);
	const artwork = images[0];

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Page d'origine si on a été redirigé par AdminRoute
	const from = (location.state as { from?: string } | null)?.from ?? "/admin";

	// On attend la fin de la restauration de session avant de décider
	if (isAuthLoading) {
		return <Loader size={56} />;
	}

	if (user) {
		return <Navigate to={from} replace />;
	}

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (submitting) return;

		setSubmitting(true);
		setError(null);

		try {
			await login({ email: email.trim(), password });
			navigate(from, { replace: true });
		} catch (err) {
			setError(
				err instanceof ApiError && err.status === 401
					? t("loginPage.error401")
					: err instanceof Error
						? err.message
						: t("loginPage.error"),
			);
			setSubmitting(false);
		}
	};

	return (
		<div className="login-page">
			<motion.div
				className="login-card"
				variants={stagger}
				initial="hidden"
				animate="show"
			>
				{/* ===== Œuvre décorative ===== */}
				<motion.figure
					className="login-card__artwork"
					variants={reveal}
					aria-hidden="true"
				>
					{artwork && (
						<img
							src={variantUrl(artwork.image_url, 800)}
							alt=""
							decoding="async"
							draggable={false}
						/>
					)}
				</motion.figure>

				{/* ===== Formulaire ===== */}
				<div className="login-card__body">
					<motion.header className="login-header" variants={reveal}>
						<span className="login-eyebrow">
							─ {t("loginPage.administration")}
						</span>
						<h1 className="login-header__title">
							{t("loginPage.connexion")}
						</h1>
						<p className="login-header__text">
							<span>
								❝ Cui multum datum est, multum quaeretur ab eo.❞
							</span>
							<span>— Lucas 12:48</span>
						</p>
					</motion.header>

					<motion.form
						className="login-form"
						variants={reveal}
						onSubmit={handleSubmit}
						noValidate
					>
						<label className="login-field">
							<span className="login-field__label">
								{t("loginPage.email")}
							</span>
							<input
								className="login-field__input"
								type="email"
								name="email"
								autoComplete="username"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={submitting}
							/>
						</label>

						<label className="login-field">
							<span className="login-field__label">
								{t("loginPage.password")}
							</span>
							<input
								className="login-field__input"
								type="password"
								name="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={submitting}
							/>
						</label>

						<AnimatePresence>
							{error && (
								<motion.p
									className="login-error"
									role="alert"
									initial={{ opacity: 0, y: -6 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.25 }}
								>
									{error}
								</motion.p>
							)}
						</AnimatePresence>

						<button
							type="submit"
							className="login-submit"
							disabled={submitting || !email || !password}
						>
							{submitting ? (
								<Loader size={20} />
							) : (
								t("loginPage.connect")
							)}
						</button>
					</motion.form>
				</div>
			</motion.div>
		</div>
	);
};

export { LoginPage };
