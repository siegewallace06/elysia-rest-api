import { Elysia, t } from "elysia";
import { createDB } from "./db";
import { faker } from "@faker-js/faker";

const app = new Elysia()
  .decorate('db', createDB())
  .get('/', () => 'Hello Elysia')
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
        })
      })
      .get('/:id', ({ params, db }) => {
        const userId = params.id
        return db.query('SELECT * FROM users WHERE user_id = $user_id')
          .get({ $user_id: userId })
      }, {
        params: t.Object({
          id: t.Number()
        })
      })
      .get('/', ({ query, db }) => {
        return db.query("SELECT * FROM users order by first_name desc limit $limit")
          .all({ $limit: query.limit })
      }, {
        query: t.Object({
          limit: t.Number()
        })
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
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);