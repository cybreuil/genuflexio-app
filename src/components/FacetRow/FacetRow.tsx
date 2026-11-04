import "./FacetRow.css";
import { useState } from "react";

import type { Facet } from "../../types/Facet";

const MAX_VISIBLE = 8;

type SingleProps = {
	mode?: "single";
	selected: string | null;
	onSelect: (value: string | null) => void;
};

type MultiProps = {
	mode: "multi";
	selected: string[];
	onSelect: (values: string[]) => void;
};

type Props = {
	label: string;
	allLabel: string;
	moreLabel?: (hidden: number) => string;
	lessLabel: string;
	items?: Facet[];
	formatLabel?: (facet: Facet) => string;
} & (SingleProps | MultiProps);

/**
 * One row of facet chips: "All" + top N values, expandable.
 * Single mode toggles one value; multi mode accumulates (AND on the API side).
 */
const FacetRow = (props: Props) => {
	const {
		label,
		allLabel,
		moreLabel = (n) => `+${n}`,
		lessLabel,
		items,
		formatLabel = (f) => f.label,
	} = props;
	const [expanded, setExpanded] = useState(false);

	if (!items || items.length === 0) return null;

	const visible = expanded ? items : items.slice(0, MAX_VISIBLE);
	const hidden = items.length - visible.length;

	const isActive = (value: string) =>
		props.mode === "multi"
			? props.selected.includes(value)
			: props.selected === value;

	const noneActive =
		props.mode === "multi"
			? props.selected.length === 0
			: props.selected === null;

	const toggle = (value: string) => {
		if (props.mode === "multi") {
			props.onSelect(
				props.selected.includes(value)
					? props.selected.filter((v) => v !== value)
					: [...props.selected, value],
			);
		} else {
			props.onSelect(props.selected === value ? null : value);
		}
	};

	const clear = () => {
		if (props.mode === "multi") props.onSelect([]);
		else props.onSelect(null);
	};

	return (
		<div className="facet-row">
			<span className="facet-row__label">{label}</span>
			<ul className="facet-row__chips">
				<li>
					<button
						type="button"
						className={`facet-chip${noneActive ? " facet-chip--active" : ""}`}
						onClick={clear}
					>
						{allLabel}
					</button>
				</li>
				{visible.map((f) => (
					<li key={f.value}>
						<button
							type="button"
							className={`facet-chip${isActive(f.value) ? " facet-chip--active" : ""}`}
							onClick={() => toggle(f.value)}
							aria-pressed={isActive(f.value)}
						>
							{formatLabel(f)}
							<span className="facet-chip__count">{f.count}</span>
						</button>
					</li>
				))}
				{hidden > 0 && (
					<li>
						<button
							type="button"
							className="facet-chip facet-chip--more"
							onClick={() => setExpanded(true)}
						>
							{moreLabel(hidden)}
						</button>
					</li>
				)}
				{expanded && items.length > MAX_VISIBLE && (
					<li>
						<button
							type="button"
							className="facet-chip facet-chip--more"
							onClick={() => setExpanded(false)}
						>
							{lessLabel}
						</button>
					</li>
				)}
			</ul>
		</div>
	);
};

export { FacetRow };
