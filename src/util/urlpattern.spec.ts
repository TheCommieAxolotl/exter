import { type as at } from 'arktype';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { type ExtractParams, generateFormattedPath, patternToSchema } from './urlpattern';

describe('urlpattern', () => {
	it('ExtractParams type should extract parameters from a URL pattern', () => {
		type Test1 = ExtractParams<'/users/:userId/posts/:postId'>;

		const test1: Test1 = { userId: '123', postId: '456' };

		expectTypeOf(test1).toMatchObjectType<{ userId: string; postId: string }>();
	});

	it('ExtractParams type should handle optional groups', () => {
		type Test2 = ExtractParams<'/users/:userId/posts{/:postId}'>;

		const test2a: Test2 = { userId: '123', postId: '456' };
		const test2b: Test2 = { userId: '123' };

		expectTypeOf(test2a).toMatchObjectType<{ userId: string; postId?: string }>();
		expectTypeOf(test2b).toMatchObjectType<{ userId: string; postId?: string }>();
	});

	it('ExtractParams type should handle wildcard segments', () => {
		type Test3 = ExtractParams<'/files/*filepath'>;

		const test3: Test3 = { filepath: 'path/to/file.txt' };

		expectTypeOf(test3).toMatchObjectType<{ filepath: string }>();
	});

	it('patternToSchema should convert URL pattern to Arktype schema', () => {
		const schema = patternToSchema('/users/:userId/posts{/:postId}');

		const expectedSchema = at({
			userId: at('string'),
			postId: at('string | undefined'),
		});

		expect(schema).toEqual(expectedSchema);
	});

	it('generateFormattedPath should generate a path from pattern and parameters', () => {
		const path = generateFormattedPath('/users/:userId/posts{/:postId}', { userId: '123', postId: '456' });

		expect(path).toBe('/users/123/posts/456');
	});

	it('generateFormattedPath should omit optional segments if parameters are missing', () => {
		const path = generateFormattedPath('/users/:userId/posts{/:postId}', { userId: '123' });

		expect(path).toBe('/users/123/posts');
	});

	it('generateFormattedPath should throw error if required parameters are missing', () => {
		// @ts-expect-error - Missing required parameter
		expect(() => generateFormattedPath('/users/:userId/posts/:postId', { userId: '123' })).toThrowError('Missing parameters: postId');
	});
});
