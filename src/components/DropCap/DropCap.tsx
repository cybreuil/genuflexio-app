import React from "react";

export function DropCap({ children }: { children: React.ReactNode }) {
	const text = React.Children.toArray(children);

	if (text.length === 0 || typeof text[0] !== "string") {
		return <p>{children}</p>;
	}

	const firstText = text[0];
	const firstLetter = firstText.charAt(0);
	const remainingText = firstText.slice(1);

	return (
		<p className="celebration-prose__paragraph">
			<span className="celebration-prose__dropcap">{firstLetter}</span>
			{remainingText}
			{...text.slice(1)}
		</p>
	);
}
