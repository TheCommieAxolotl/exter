import { ark } from 'arktype';
import { compile, parse, type Token } from 'path-to-regexp';
import type { StandardWithShape } from './standard';

type SplitPath<S extends string> = S extends `${infer Head}{${infer Body}}${infer Tail}`
	? [...SplitPath<Head>, `{${Body}}`, ...SplitPath<Tail>]
	: S extends `${infer Head}/${infer Tail}`
		? [Head, ...SplitPath<Tail>]
		: [S];

type ParamEntry<S extends string, InOptional extends boolean = false> = S extends `:${infer Param}`
	? { name: Param; optional: InOptional }
	: S extends `*${infer Param}`
		? { name: Param; optional: InOptional }
		: never;

type SegmentParams<S extends string> = S extends `{/${infer Inner}}` ? ParamEntry<Inner, true> : ParamEntry<S>;

type ExtractParamEntries<S extends string> = SegmentParams<SplitPath<S>[number]>;

export type ExtractParams<S extends string> = {
	// required
	[P in ExtractParamEntries<S> as P extends { name: infer N extends string; optional: false } ? N : never]: string;
} & {
	// optional
	[P in ExtractParamEntries<S> as P extends { name: infer N extends string; optional: true } ? N : never]?: string;
};

const handleToken = (token: Token, acc: Record<string, string>, optional: boolean) => {
	switch (token.type) {
		case 'param':
			acc[token.name] = optional ? 'string | undefined' : 'string';
			break;
		case 'group':
			for (const nestedToken of token.tokens) {
				handleToken(nestedToken, acc, true);
			}
			break;
		// Ignore other token types (static text, etc.)
	}
};

export const patternToSchema = <S extends string>(path: S): StandardWithShape<ExtractParams<S>> => {
	try {
		const { tokens } = parse(path);

		const shape = tokens.reduce(
			(acc, token) => {
				handleToken(token, acc, token.type === 'group');

				return acc;
			},
			{} as Record<string, string>,
		);

		return ark.type(shape) as StandardWithShape<ExtractParams<S>>;
	} catch (error) {
		throw new Error(`Failed to parse path: ${path}. Error: ${error}`);
	}
};

export const generateFormattedPath = <S extends string>(path: S, params: ExtractParams<S>): string => {
	const toPath = compile(path, { encode: encodeURIComponent });

	return toPath(params);
};
