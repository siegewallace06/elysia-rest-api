import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger';
import { createDB } from "./db"; // Assuming your db setup is in './db'
import { faker } from "@faker-js/faker";

const app = new Elysia()
  // 1. Register the Swagger plugin FIRST.
  // This allows it to scan all subsequent routes.
  .use(swagger({
    documentation: {
      info: {
        title: 'User API Documentation',
        version: '1.0.0',
        description: 'A simple API for managing and seeding user data with ElysiaJS.'
      },
      // Define tags to categorize your endpoints in the UI
      tags: [
        { name: 'App', description: 'General application endpoints' },
        { name: 'Users', description: 'Endpoints for user management' },
        { name: 'Seed', description: 'Endpoints for populating the database' }
      ]
    }
  }))

  // 2. Decorate the instance with your database
  .decorate('db', createDB())

  // 3. Define all your routes with detailed documentation
  .get('/', () => 'Hello Elysia', {
    detail: {
      summary: 'API root endpoint',
      description: 'Returns a simple welcome message.',
      tags: ['App']
    }
  })

  .group('/users', app =>
    app
      .post('/', ({ body, db }) => {
        const insertUser = db.prepare(
          "INSERT INTO users (first_name, last_name, email, about) VALUES ($first_name, $last_name, $email, $about) RETURNING *");
        const insertedUser = insertUser.get({
          $first_name: body.first_name,
          $last_name: body.last_name,
          $email: body.email,
          $about: body.about || null
        });
        return insertedUser;
      }, {
        body: t.Object({
          first_name: t.String({ description: "User's first name" }),
          last_name: t.String({ description: "User's last name" }),
          email: t.String({ description: "User's unique email address", format: 'email' }),
          about: t.Optional(t.String({ description: "A short bio about the user" }))
        }),
        detail: {
          summary: 'Create a new user',
          description: 'Adds a new user to the database based on the provided data.',
          tags: ['Users']
        }
      })
      .get('/:id', ({ params, db }) => {
        const userId = params.id;
        return db.query('SELECT * FROM users WHERE user_id = $user_id')
          .get({ $user_id: userId });
      }, {
        params: t.Object({
          id: t.Numeric({ description: 'The unique ID of the user to retrieve' })
        }),
        detail: {
          summary: 'Get a user by ID',
          description: 'Retrieves the details for a single user by their unique ID.',
          tags: ['Users']
        }
      })
      .get('/', ({ query, db }) => {
        return db.query("SELECT * FROM users ORDER BY first_name DESC LIMIT $limit")
          .all({ $limit: query.limit });
      }, {
        query: t.Object({
          limit: t.Numeric({ default: 10, description: 'The maximum number of users to return' })
        }),
        detail: {
          summary: 'Get a list of users',
          description: 'Retrieves a list of users, with an optional limit on the number of results.',
          tags: ['Users']
        }
      })
  )

  .post('/seed', ({ db }) => {
    const insertUser = db.prepare(
      "INSERT INTO users (first_name, last_name, email, about) VALUES ($first_name, $last_name, $email, $about) RETURNING *");
    for (let i = 0; i < 100; i++) {
      insertUser.get({
        $first_name: faker.person.firstName(),
        $last_name: faker.person.lastName(),
        $email: faker.internet.email(),
        $about: faker.lorem.text()
      });
    }
    return `Successfully seeded 100 users`;
  }, {
    detail: {
      summary: 'Seed the database',
      description: 'Populates the database with 100 fake users using the Faker library. Useful for development and testing.',
      tags: ['Seed']
    }
  })

  // 4. Start the server
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📄 Swagger UI is available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);