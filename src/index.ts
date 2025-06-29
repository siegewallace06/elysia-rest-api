import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { createDB } from "./db";
import { faker } from "@faker-js/faker";

const app = new Elysia()
  .use(swagger({
    path: '/docs',
    exclude: [],
    documentation: {
      info: {
        title: "Elysia REST API",
        version: "1.0.0",
        description: "Simple REST API built with Elysia and SQLite",
      },
      tags: [
        { name: "Users", description: "User management operations" },
        { name: "Seeding", description: "Database seeding operations" },
        { name: "App", description: "Root endpoint" }
      ]
    }
  }))
  .decorate('db', createDB())
  .get('/', () => 'Hello Elysia', {
    detail: {
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
        })
        return insertedUser
      }, {
        body: t.Object({
          first_name: t.String(),
          last_name: t.String(),
          email: t.String(),
          about: t.Optional(t.String())
        }),
        detail: {
          tags: ['Users'],
          summary: 'Create a new user',
          description: 'Create a new user with the provided information'
        }
      })
      .get('/:id', ({ params, db }) => {
        const userId = params.id
        return db.query('SELECT * FROM users WHERE user_id = $user_id')
          .get({ $user_id: userId })
      }, {
        params: t.Object({
          id: t.Number()
        }),
        detail: {
          tags: ['Users'],
          summary: 'Get user by ID',
          description: 'Retrieve a specific user by their unique ID'
        }
      })
      .get('/', ({ query, db }) => {
        return db.query("SELECT * FROM users order by first_name desc limit $limit")
          .all({ $limit: query.limit })
      }, {
        query: t.Object({
          limit: t.Number()
        }),
        detail: {
          tags: ['Users'],
          summary: 'Get all users with limit',
          description: 'Retrieve a list of users with pagination support, ordered by first name descending'
        }
      })
  )
  .post('/seed', ({ db }) => {
    const insertUser = db.prepare(
      "INSERT INTO users (first_name, last_name, email, about) VALUES ($first_name, $last_name, $email, $about) RETURNING *");
    for (let i = 0; i < 100; i++) {
      insertUser.get({
        $first_name: faker.person.firstName(),
        $last_name: faker.person.firstName(),
        $email: faker.internet.email(),
        $about: faker.lorem.text()
      })
    }
    return `Successfully seeded 100 users`
  }, {
    detail: {
      tags: ['Seeding'],
      summary: 'Seed database with 100 fake users',
      description: 'Generate and insert 100 fake users into the database using Faker.js'
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);