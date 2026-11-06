import type { LanguageCode } from "../../types/Language";
import { useLanguage } from "../../hooks/useLanguage";
import "./LanguageDropDown.css";

const LanguageDropDown = () => {
	const { setLanguageCode, languageCode } = useLanguage();

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setLanguageCode(e.target.value as LanguageCode);
	};

	return (
		<div className="language-dropdown" aria-label="Language selection">
			<select onChange={onChange} value={languageCode}>
				<option value="en">English</option>
				<option value="fr">Français</option>
				<option value="la">Latina</option>
			</select>
		</div>
	);
};

export { LanguageDropDown };
