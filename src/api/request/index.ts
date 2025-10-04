import type { ValidatorResult } from '../../util/result';
import type { UnsafeAny } from '../../util/types';
import { type ExtractParams, generateFormattedPath } from '../../util/urlpattern';
import { RequestError } from './error';

export type QueryParams = Record<string, string | number | boolean | undefined> | URLSearchParams | string;

export type RequestReturn<R extends ValidatorResult<UnsafeAny, UnsafeAny>> = R extends ValidatorResult<infer D, infer E>
	?
			| {
					success: true;
					data: D;
					error: null;
					'~res': Response;
					'~data': unknown;
			  }
			| {
					success: false;
					data: undefined;
					error: E | undefined;
					code: string;
					'~data': unknown;
					'~res': Response;
					'~error': RequestError;
			  }
	: never;

export interface RequestOptions {
	baseUrl: string;
	defaultRequestInit?: RequestInit;
}

export interface RouteDefinition<S extends string, D extends UnsafeAny, E extends UnsafeAny> {
	endpoint: S;
	result: ValidatorResult<D, E>;
}

export async function executeRequest<R extends RouteDefinition<string, UnsafeAny, UnsafeAny>>(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	route: R,
	params: ExtractParams<R['endpoint']>,
	query: QueryParams | undefined,
	options: RequestOptions,
	requestInit?: RequestInit,
): Promise<RequestReturn<R['result']>> {
	const targetEndpoint = generateFormattedPath(route.endpoint, params);
	const baseUrl = new URL(options.baseUrl);

	const targetPathname = baseUrl.pathname.endsWith('/') ? baseUrl.pathname.slice(0, -1) : baseUrl.pathname;
	const formattedPathname = targetEndpoint.startsWith('/') ? targetEndpoint : `/${targetEndpoint}`;

	const url = new URL(`${targetPathname}${formattedPathname}`, baseUrl);

	if (query) {
		if (typeof query === 'string') {
			url.search = query;
		} else if (query instanceof URLSearchParams) {
			url.search = query.toString();
		} else {
			Object.entries(query).forEach(([key, value]) => {
				if (value !== undefined) {
					url.searchParams.set(key, String(value));
				}
			});
		}
	}

	const _res = await fetch(url.toString(), {
		...options.defaultRequestInit,
		...requestInit,
		method: method,
	});

	const res = _res.clone();

	if (!res.ok) {
		return await handleErrorResponse(res, _res, route);
	}

	return await handleSuccessResponse(res, _res, route);
}

async function handleErrorResponse<R extends RouteDefinition<string, UnsafeAny, UnsafeAny>>(res: Response, originalRes: Response, route: R): Promise<RequestReturn<R['result']>> {
	const data = await res.text();

	try {
		const safeError = await route.result.error['~standard'].validate(JSON.parse(data));

		return {
			success: false,
			code: `REQUEST_FAILED_${res.status}`,
			data: undefined,
			error: 'value' in safeError ? safeError.value : undefined,
			'~data': data,
			'~res': originalRes,
			'~error': new RequestError(`Request failed with status ${res.status}`, `REQUEST_FAILED_${res.status}`, {
				statusCode: res.status,
				statusText: res.statusText,
				url: res.url,
			}),
		} as RequestReturn<R['result']>;
	} catch (e) {
		return {
			success: false,
			code: `REQUEST_FAILED_${res.status}`,
			data: undefined,
			error: undefined,
			'~data': data,
			'~res': originalRes,
			'~error': new RequestError(`Request failed with status ${res.status} and could not parse error response`, `REQUEST_FAILED_${res.status}`, {
				cause: e,
				statusCode: res.status,
				statusText: res.statusText,
				url: res.url,
			}),
		} as RequestReturn<R['result']>;
	}
}

async function handleSuccessResponse<R extends RouteDefinition<string, UnsafeAny, UnsafeAny>>(res: Response, originalRes: Response, route: R): Promise<RequestReturn<R['result']>> {
	let data: unknown;

	try {
		data = await res.json();
	} catch (e) {
		return {
			success: false,
			code: 'COULD_NOT_PARSE_JSON',
			data: undefined,
			error: undefined,
			'~data': undefined,
			'~res': originalRes,
			'~error': new RequestError('Failed to parse response as JSON', 'COULD_NOT_PARSE_JSON', {
				cause: e,
				statusCode: res.status,
				statusText: res.statusText,
				url: res.url,
			}),
		} as RequestReturn<R['result']>;
	}

	const safeData = await route.result.data['~standard'].validate(data);

	if (!('value' in safeData)) {
		return {
			success: false,
			code: 'RESPONSE_VALIDATION_FAILED',
			data: undefined,
			error: undefined,
			'~data': data,
			'~res': originalRes,
			'~error': new RequestError('Response validation failed', 'RESPONSE_VALIDATION_FAILED', {
				cause: safeData.issues,
				statusCode: res.status,
				statusText: res.statusText,
				url: res.url,
			}),
		} as RequestReturn<R['result']>;
	}

	return {
		success: true,
		data: safeData.value,
		error: null,
		'~data': data,
		'~res': originalRes,
	} as RequestReturn<R['result']>;
}
