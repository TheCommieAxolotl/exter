const ESC = '\x1b';
const CSI = `${ESC}[`;

export enum Style {
	RESET = 0,
	BOLD = 1,
	FAINT = 2,
	ITALIC = 3,
	UNDERLINE = 4,
	BLINK = 5,
	REVERSE = 7,
	HIDDEN = 8,
}

export enum Color {
	// Special color setting codes
	SET_COLOR = 38,
	SET_BACKGROUND = 48,

	// Standard foreground colors
	BLACK = 30,
	RED = 31,
	GREEN = 32,
	YELLOW = 33,
	BLUE = 34,
	MAGENTA = 35,
	CYAN = 36,
	WHITE = 37,
	DEFAULT = 39,

	// Bright colors
	BRIGHT_BLACK = 90,
	BRIGHT_RED = 91,
	BRIGHT_GREEN = 92,
	BRIGHT_YELLOW = 93,
	BRIGHT_BLUE = 94,
	BRIGHT_MAGENTA = 95,
	BRIGHT_CYAN = 96,
	BRIGHT_WHITE = 97,
}

export function text(text: string, fg?: Color | string, bg?: Color | string, style?: Style, disable: boolean = false): string {
	if (disable) return text;

	const codes: string[] = [];

	if (style !== undefined) {
		codes.push(style.toString());
	}

	if (fg !== undefined) {
		if (typeof fg === 'string') {
			codes.push(`38;${fg}`);
		} else {
			codes.push(fg.toString());
		}
	}

	if (bg !== undefined) {
		if (typeof bg === 'string') {
			codes.push(`48;${bg}`);
		} else {
			// background color codes are usually fg + 10
			codes.push((bg + 10).toString());
		}
	}

	return `${CSI}${codes.join(';')}m${text}${CSI}0m`;
}

export function rgb(r: number, g: number, b: number): string {
	return `2;${r};${g};${b}`;
}
