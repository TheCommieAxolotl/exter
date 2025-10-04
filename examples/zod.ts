import e from 'exter';
import z from 'zod';

const externalApi = e.api(
	[
		{
			endpoint: '/posts/:id',
			// Result is used to define the success and error types
			// The first type is the success type, the second is the error type
			result: e.result(
				z.object({
					id: z.number(),
					title: z.string(),
					body: z.string(),
				}),
				z.object({}),
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
