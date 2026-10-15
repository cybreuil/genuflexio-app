import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/panel.css";
import "./index.css";

// Context Providers
import { CalendarProvider } from "./contexts/CalendarProvider.tsx";
import { LanguageProvider } from "./contexts/LanguageProvider.tsx";
import { ThemeProvider } from "./contexts/ThemeProvider.tsx";
import { AuthProvider } from "./contexts/AuthProvider.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<ThemeProvider>
					<LanguageProvider>
						<CalendarProvider>
							<App />
						</CalendarProvider>
					</LanguageProvider>
				</ThemeProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
