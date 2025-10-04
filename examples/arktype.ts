import { type } from 'arktype';
import e from 'exter';

const externalApi = e.api(
	[
		{
			endpoint: '/posts/:id',
			// Result is used to define the success and error types
			// The first type is the success type, the second is the error type
			result: e.result(
				type({
					id: 'number',
					title: 'string',
					body: 'string',
				}),
				type({}),
			),
		},
	],
	{
		baseUrl: 'https://jsonplaceholder.typicode.com',
	},
);

const posts = externalApi.route('/posts/:id');

const res = await posts.get({ id: '1' });

if (res.success) {
	console.log(res.data.title); // -> "sunt aut facere repellat provident occaecati excepturi optio reprehenderit"
} else {
	console.error(res['~error']); // -> "Not Found"
}
