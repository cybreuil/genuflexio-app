type IconProps = React.SVGProps<SVGSVGElement> & {
	title?: string | null;
	fill?: string;
	fillHalo?: string;
	width?: number | string;
	height?: number | string;
};

type IconWithTextProps = IconProps & {
	fillFirstLetter?: string;
};

export type { IconProps, IconWithTextProps };
