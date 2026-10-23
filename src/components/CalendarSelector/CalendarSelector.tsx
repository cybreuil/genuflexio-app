import { useMemo } from "react";
import "./CalendarSelector.css";
import { useCalendar } from "../../hooks/useCalendar";
import { useCalendars } from "../../hooks/useCalendars";
import { flattenCalendars } from "../../utils/flattenCalendars";
import { useLanguage } from "../../hooks/useLanguage";

const CalendarSelector = () => {
	const { languageCode, t } = useLanguage();

	const { calendar, setCalendar } = useCalendar();
	const { calendars, loading, error } = useCalendars(languageCode);

	const options = useMemo(() => flattenCalendars(calendars), [calendars]);

	return (
		<div className="panel calendar-selector">
			<h3 className="panel__title">{t("calendars.genericName")}</h3>

			<select
				disabled={!calendars.length || loading || !!error}
				value={calendar?.code ?? ""}
				onChange={(e) => {
					const selectedCalendar = calendars.find(
						(c) => c.code === e.target.value,
					);

					if (selectedCalendar) {
						setCalendar(selectedCalendar);
					}
				}}
			>
				{!calendars.length && !loading && !error && (
					<option value="">{t("calendars.noCalendar")}</option>
				)}
				{loading && (
					<option value="">{t("calendars.loadingCalendars")}</option>
				)}
				{error && (
					<option value="">{t("calendars.loadingError")}</option>
				)}
				{options.map((c) => (
					<option
						key={c.code}
						value={c.code}
						disabled={
							c.code === "ROMAN_1960" ||
							c.code === "ROMAN_1960_FRANCE"
						}
					>
						{"\u00A0\u00A0".repeat(c.depth)}
						{c.depth > 0 ? "↳ " : ""}
						{c.name}
					</option>
				))}
			</select>
		</div>
	);
};

export { CalendarSelector };
