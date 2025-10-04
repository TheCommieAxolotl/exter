// biome-ignore lint/suspicious/noExplicitAny: This is intentional
export type UnsafeAny = any;

export type SimpleSchemaType =
	| 'string'
	| 'number'
	| 'bigint'
	| 'boolean'
	| 'symbol'
	| 'undefined'
	| 'object'
	| 'Key'
	| 'Record'
	| 'Date'
	| 'Array'
	| 'false'
	| 'never'
	| 'null'
	| 'true'
	| 'unknown'
	| 'TypedArray'
	| 'FormData'
	| 'ArrayBuffer'
	| 'Blob'
	| 'File'
	| 'Headers'
	| 'Request'
	| 'Response'
	| 'URL'
	| 'Error'
	| 'Function'
	| 'Map'
	| 'Promise'
	| 'RegExp'
	| 'Set'
	| 'WeakMap'
	| 'WeakSet';

type SimpleSchemaValue = SimpleSchemaType | SimpleSchema | (SimpleSchemaType | SimpleSchema)[];

export type SimpleSchema = {
	[key: string]: SimpleSchemaValue;
};
