import { migrate, getMigrations } from "bun-sqlite-migrations";
import Database from "bun:sqlite";

export const createDB = () => {
    console.log("Creating database...");
    const db = new Database("elysia-rest-api.db");
    migrate(db, getMigrations('./migrations'));
    return db;
};
