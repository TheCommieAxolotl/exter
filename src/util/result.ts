import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ark } from 'arktype';
import type { SimpleSchema } from './types';

export const resultSchema = ark.type({
	success: 'boolean',
	data: 'unknown',
	error: 'unknown',
});

/**
 * Creates a structure that can be used to validate the success and error types of a request.
 * The first type is the success type, the second is the error type.
 * If no error type is provided, it defaults to `null | undefined`.
 * @param data {StandardSchemaV1<unknown, D> | SimpleSchema}
 * @param error {StandardSchemaV1<unknown, E> | SimpleSchema}
 * @returns {ValidatorResult<D, E>}
 */
export const result = <D, E>(data: StandardSchemaV1<unknown, D> | SimpleSchema, error?: StandardSchemaV1<unknown, E> | SimpleSchema): ValidatorResult<D, E> => {
	if (typeof data !== 'object' || data === null) {
		throw new Error('Data must be an object or a schema.');
	}

	if (error && (typeof error !== 'object' || error === null)) {
		throw new Error('Error must be an object or a schema.');
	}

	return {
		data: '~standard' in data ? (data as StandardSchemaV1<unknown, D>) : ({ '~standard': ark.type(data)['~standard'] } as StandardSchemaV1<unknown, D>),
		error: error
			? '~standard' in error
				? (error as StandardSchemaV1<unknown, E>)
				: ({ '~standard': error ? ark.type(error) : ark.type('null | undefined')['~standard'] } as StandardSchemaV1<unknown, E>)
			: { '~standard': ark.type('null | undefined')['~standard'] },
	};
};

export type ValidatorResult<D, E> = {
	data: StandardSchemaV1<unknown, D>;
	error: StandardSchemaV1<unknown, E> | StandardSchemaV1<null | undefined>;
};
