import { Route, Routes } from "react-router-dom";
import { HomePage } from "../../pages/HomePage/HomePage";
import { CelebrationOfTheDay } from "../../pages/CelebrationOfTheDay/CelebrationOfTheDay";
import { SaintsPage } from "../../pages/SaintsPage/SaintsPage";
import { SaintPage } from "../../pages/SaintPage/SaintPage";
import { GalleryPage } from "../../pages/GalleryPage/GalleryPage";
import { AboutPage } from "../../pages/AboutPage/AboutPage";
import { AdminPage } from "../../pages/AdminPage/AdminPage";
import { LoginPage } from "../../pages/LoginPage/LoginPage";
import { NotFoundPage } from "../../pages/NotFoundPage/NotFoundPage";

import { AdminRoute } from "../Auth/AdminRoute";

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/celebration" element={<CelebrationOfTheDay />} />
			<Route
				path="/celebration/:date"
				element={<CelebrationOfTheDay />}
			/>
			<Route path="/saints" element={<SaintsPage />} />
			<Route path="/saints/:slug" element={<SaintPage />} />
			<Route path="/gallery" element={<GalleryPage />} />
			<Route path="/about" element={<AboutPage />} />

			<Route path="/login" element={<LoginPage />} />

			<Route element={<AdminRoute />}>
				<Route path="/admin" element={<AdminPage />} />
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export { AppRoutes };
