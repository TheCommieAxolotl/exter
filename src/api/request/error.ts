export class RequestError extends Error {
	statusCode?: number;
	statusText?: string;
	url?: string;

	constructor(
		name: string,
		public code: string,
		options: ErrorOptions & {
			statusCode?: number;
			statusText?: string;
			url?: string;
		},
	) {
		super(`Error while fetching [${options.url || '<unknown>'}]: ${name}`, options);

		this.name = 'RequestError';
		this.statusCode = options.statusCode;
		this.statusText = options.statusText;
		this.url = options.url;
	}
}
