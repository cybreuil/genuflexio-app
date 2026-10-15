import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import { BodyClassController } from "./components/BodyClassController/BodyClassController";
import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop";
import { ScrollToTopOnRouteChange } from "./components/ScrollToTopOnRouteChange/ScrollToTopOnRouteChange";
import { AppRoutes } from "./components/AppRoutes/AppRoutes";
import { useVisitLogger } from "./hooks/useVisitLogger";

function App() {
	// Ping analytics une fois par session, au premier chargement du site.
	useVisitLogger();

	return (
		<>
			<ScrollToTopOnRouteChange />
			<ScrollToTop />
			<Header />
			<BodyClassController />
			<AppRoutes />
			<Footer />
		</>
	);
}

export { App };
