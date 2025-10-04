import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, watch } from 'node:fs';
import { readdir, rm, stat } from 'node:fs/promises';
import { build } from 'esbuild';
import { Color, Style, text } from './tty';

const isDev = process.argv.includes('--dev');

const ESC = '\x1b';

const unwriteLine = () => process.stdout.write(`${ESC}[2K${ESC}[0G`);
const newline = (n?: number) => process.stdout.write('\n'.repeat(n || 1));

process.stdout.write(`${ESC}[?1049h`);
process.stdout.write(`${ESC}[?25l`);

process.stdin.setRawMode?.(true);
process.stdin.resume();

process.stdin.on('data', (data) => {
	if (data.toString() === '\u0003') {
		process.exit();
	}

	if (data.toString() === 'q') {
		process.exit();
	}
});

const clearDisplay = () => {
	process.stdout.write(`${ESC}[H`);
	process.stdout.write(`${ESC}[J`);
};

clearDisplay();

const timeFormat = (ms: number) => {
	const bright = (t: string) => text(t, Color.GREEN);
	const faint = (t: string) => text(t, Color.GREEN, undefined, Style.FAINT);

	if (ms < 100) return `${bright(ms.toFixed(2))}${faint('ms')}`;
	if (ms < 60000) return `${bright((ms / 1000).toFixed(2))}${faint('s')}`;
	return `${bright((ms / 60000).toFixed(2))}${faint('m')}`;
};

const check = text('✓', Color.GREEN);

process.on('exit', async () => {
	process.stdout.write(`${ESC}[?1049l`);
	process.stdout.write(`${ESC}[?25h`);

	process.stdin.setRawMode?.(false);
	process.stdin.pause();

	console.log(`${text(' SUCCESS ', Color.BLACK, Color.GREEN, Style.BOLD)} ${text('Built successfully', Color.GREEN, undefined, Style.FAINT)}`);
	console.log();

	const files = readdirSync('dist', {
		recursive: true,
		withFileTypes: true,
	});

	for (const file of files) {
		if (file.isDirectory()) continue;

		const stats = statSync(`${file.parentPath}/${file.name}`);

		console.log(`  ${text(`• ${file.parentPath}/`, Color.DEFAULT, undefined, Style.FAINT)}${text(file.name, Color.GREEN)} (${(stats.size / 1024).toFixed(2)} KB)`);
	}
});

async function buildLibrary() {
	const startclean = performance.now();

	process.stdout.write(text('Cleaning dist...', Color.YELLOW));

	if (existsSync('dist')) {
		await rm('dist', { recursive: true });
	}

	unwriteLine();
	process.stdout.write(`${check} Cleaned dist. ${timeFormat(performance.now() - startclean)}`);

	const startbuild = performance.now();

	newline();
	process.stdout.write(text('Building...', Color.YELLOW));

	// Build for CommonJS
	await build({
		entryPoints: ['src/index.ts'],
		bundle: true,
		outdir: 'dist',
		sourcemap: false,
		format: 'cjs',
		target: 'node16',
		minify: true,
		platform: 'node',
		external: [],
	});

	// Build for ESM
	await build({
		entryPoints: ['src/index.ts'],
		bundle: true,
		outdir: 'dist/esm',
		format: 'esm',
		sourcemap: false,
		target: 'node16',
		minify: true,
		platform: 'node',
		external: [],
	});

	unwriteLine();
	process.stdout.write(`${check} Built. ${timeFormat(performance.now() - startbuild)}`);

	const starttypes = performance.now();

	newline();
	process.stdout.write(text('Generating type definitions...', Color.YELLOW));

	execSync('pnpm tsc --emitDeclarationOnly --outDir dist --project tsconfig.json --excludeDirectories test,examples', { stdio: 'inherit' });

	await rm('dist/examples', { recursive: true }).catch(() => {});
	await rm('dist/test', { recursive: true }).catch(() => {});

	unwriteLine();
	process.stdout.write(`${check} Generated type definitions. ${timeFormat(performance.now() - starttypes)}`);

	const files = await readdir('dist', {
		recursive: true,
		withFileTypes: true,
	});

	newline();

	for (const file of files) {
		if (file.isDirectory()) continue;

		const stats = await stat(`${file.parentPath}/${file.name}`);

		newline();
		process.stdout.write(`  ${text(`• ${file.parentPath}/`, Color.DEFAULT, undefined, Style.FAINT)}${text(file.name, Color.GREEN)} (${(stats.size / 1024).toFixed(2)} KB)`);
	}
}

const doBuild = async () => {
	try {
		await buildLibrary();
		newline(2);
		process.stdout.write(`${text(' SUCCESS ', Color.BLACK, Color.GREEN, Style.BOLD)} ${text('Watching for file changes...', Color.GREEN)}`);
		newline();
		process.stdout.write(
			`          ${text('press', Color.DEFAULT, undefined, Style.FAINT)} ${text('q', Color.DEFAULT, undefined, Style.BOLD)} ${text('to quit', Color.DEFAULT, undefined, Style.FAINT)}`,
		);
		newline();
	} catch (e) {
		newline();
		process.stdout.write((e as Error).message);
		newline(2);
		process.stdout.write(`${text(' ERROR ', Color.BLACK, Color.RED, Style.BOLD)} ${text('Watching for file changes...', Color.RED)}`);
		newline();
		process.stdout.write(
			`          ${text('press', Color.DEFAULT, undefined, Style.FAINT)} ${text('q', Color.DEFAULT, undefined, Style.BOLD)} ${text('to quit', Color.DEFAULT, undefined, Style.FAINT)}`,
		);
		newline();
	}
};

if (isDev) {
	watch('src', { recursive: true }, async (_, filename) => {
		if (filename) {
			clearDisplay();

			process.stdout.write(`${text(' RERUN ', Color.BLACK, Color.BLUE, Style.BOLD)} ${text(filename, Color.BLUE, undefined, Style.FAINT)}`);
			newline(2);

			await doBuild();
		}
	});

	process.stdout.write(`${text(' DEV ', Color.BLACK, Color.BLUE, Style.BOLD)} ${text('Starting build...', Color.BLUE, undefined, Style.FAINT)}`);

	newline(2);

	await doBuild();
} else {
	process.stdout.write(`${text(' BUILD ', Color.BLACK, Color.BLUE, Style.BOLD)} ${text('Starting build...', Color.BLUE, undefined, Style.FAINT)}`);

	newline(2);

	await doBuild();

	process.exit();
}
