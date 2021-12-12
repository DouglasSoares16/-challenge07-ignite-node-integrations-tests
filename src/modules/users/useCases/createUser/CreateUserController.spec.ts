import { app } from "../../../../app";
import request from "supertest";
import { Connection } from "typeorm";
import createConnection from "../../../../database";

let connection: Connection;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Georgie Lynch",
      email: "ep@le.uk",
      password: "12345"
    });

    expect(response.status).toBe(201);
  });

  it("Should not be able to create a new user, if there is already a user with the same email", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Georgie Lynch",
      email: "ep@le.uk",
      password: "12345"
    });

    const response = await request(app).post("/api/v1/users").send({
      name: "Carrie Crawford",
      email: "ep@le.uk",
      password: "54321"
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });
})
