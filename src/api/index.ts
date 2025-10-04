import type { UnsafeAny } from '../util/types';
import type { ExtractParams } from '../util/urlpattern';
import { executeRequest, type QueryParams, type RequestOptions, type RequestReturn, type RouteDefinition } from './request';

export type Route<S extends string, D extends UnsafeAny, E extends UnsafeAny> = RouteDefinition<S, D, E>;

export { RequestError } from './request/error';

type Api<Routes extends Route<string, UnsafeAny, UnsafeAny>[]> = {
	route: <const E extends Routes[number]['endpoint']>(
		endpoint: E,

		query?: QueryParams,
	) => ApiRoute<Extract<Routes[number], { endpoint: E }>>;
};

type ApiRoute<R extends Route<string, UnsafeAny, UnsafeAny>> = {
	/**
	 * Executes a GET request to the route.
	 */
	get(params: ExtractParams<R['endpoint']>, requestInit?: RequestInit): Promise<RequestReturn<R['result']>>;
	/**
	 * Executes a POST request to the route.
	 */
	post(params: ExtractParams<R['endpoint']>, requestInit?: RequestInit): Promise<RequestReturn<R['result']>>;
	/**
	 * Executes a PUT request to the route.
	 */
	put(params: ExtractParams<R['endpoint']>, requestInit?: RequestInit): Promise<RequestReturn<R['result']>>;
	/**
	 * Executes a DELETE request to the route.
	 */
	delete(params: ExtractParams<R['endpoint']>, requestInit?: RequestInit): Promise<RequestReturn<R['result']>>;
	/**
	 * Executes a PATCH request to the route.
	 */
	patch(params: ExtractParams<R['endpoint']>, requestInit?: RequestInit): Promise<RequestReturn<R['result']>>;
};

export interface ApiOptions extends RequestOptions {}

/**
 * Creates an API client with the given routes and options.
 * @param routes {Route[]} Array of route definitions.
 * @param options {RequestOptions} Options for the API client.
 * @returns {Api<Routes>} The API client.
 */
export const api = <const Routes extends Route<string, UnsafeAny, UnsafeAny>[]>(routes: Routes, options: ApiOptions): Api<Routes> => {
	return {
		route: <const E extends Routes[number]['endpoint']>(endpoint: E, query?: QueryParams): ApiRoute<Extract<Routes[number], { endpoint: E }>> => {
			const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
			const route = routes.find((r) => r.endpoint === endpoint) as Extract<Routes[number], { endpoint: E }>;

			if (!route) {
				throw new Error(`Route with endpoint "${endpoint}" not found.`);
			}

			return methods
				.map((m) => m.toLowerCase())
				.reduce(
					(acc, method) => {
						return Object.assign({}, acc, {
							[method]: <R extends Extract<Routes[number], { endpoint: E }>>(params: ExtractParams<R['endpoint']>, requestInit?: RequestInit) => {
								return executeRequest(method.toUpperCase() as (typeof methods)[number], route, params, query, options, requestInit);
							},
						});
					},
					{} as ApiRoute<Extract<Routes[number], { endpoint: E }>>,
				);
		},
	};
};
