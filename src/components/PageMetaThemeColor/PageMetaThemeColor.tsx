import { useEffect } from "react";

export function PageMetaThemeColor() {
	useEffect(() => {
		const updateThemeColor = () => {
			const background = getComputedStyle(document.body)
				.getPropertyValue("--page-background")
				.trim();

			if (!background) return;

			let meta = document.querySelector<HTMLMetaElement>(
				'meta[name="theme-color"]',
			);

			if (!meta) {
				meta = document.createElement("meta");
				meta.name = "theme-color";
				document.head.appendChild(meta);
			}

			meta.setAttribute("content", background);
		};

		updateThemeColor();

		const observer = new MutationObserver(updateThemeColor);

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ["class", "style"],
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		});

		return () => observer.disconnect();
	}, []);

	return null;
}
