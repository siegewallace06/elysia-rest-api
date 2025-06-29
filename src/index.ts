import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .get("/users", () => "List of users")
  .get("/users/:id", ({ params }) => `User ID: ${params.id}`)
  .post("/users", ({ body }) => `User created with name: ${body.name}`)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
