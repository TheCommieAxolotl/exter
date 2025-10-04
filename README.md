# exter

Make any API typesafe.

```ts
import e from 'exter';

const api = e.api([
  {
    endpoint: '/posts/:id',
    result: e.result(
      { // success type
        id: 'number', 
        title: 'string', 
        body: 'string'
      },
      { // error type
        error: 'string'
      }
    ),
  }],
  {
    baseUrl: 'https://jsonplaceholder.typicode.com',
  }
);

const posts = api.route('/posts/:id');

const res = await posts.get({ id: '1' })

if (res.success) {
  console.log(res.data.title); // -> "sunt aut facere repellat provident occaecati excepturi optio reprehenderit"
} else {
  console.error(res.error); // -> "Not Found"
}
```

## Optional Dependencies

`exter` implements the [Standard Schema](https://standardschema.dev) specification for defining response schemas. This means you can use any [supported library](https://standardschema.dev/#what-schema-libraries-implement-the-spec) to define your schemas.

```ts
import e from 'exter';
import z from 'zod';

const api = e.api([
  {
    endpoint: '/posts/:id',
    result: e.result(
      z.object({
        id: z.number(),
        title: z.string(),
        body: z.string().min(10),
        url: z.url(),
      }),
    ),
  }],
  {
    baseUrl: 'https://jsonplaceholder.typicode.com',
  }
);
```

> [!NOTE]  
> You do not need to add any dependencies if you only need simple schemas. `exter` uses a subset of [arktype](https://arktype.dev) internally to support simple schemas.

```ts
const api = e.api([
  {
    endpoint: '/posts/:id',
    result: e.result(
      {
        id: 'number',
        title: 'string',
        body: 'string',
      },
    ),
  }]
);
```
