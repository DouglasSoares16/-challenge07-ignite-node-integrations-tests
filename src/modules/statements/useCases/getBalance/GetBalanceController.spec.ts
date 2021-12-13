import request from "supertest";
import createConnection from "../../../../database";

import { Connection } from "typeorm";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get all balance of user", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Samuel Craig",
      email: "rezgu@ifo.ph",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "rezgu@ifo.ph",
        password: "12345"
      });

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 600,
        description: "Create Deposit"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 300,
        description: "Create Withdraw Test"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.status).toBe(200);
    expect(response.body.statement).toHaveLength(2);
    expect(response.body.balance).toBe(300);
  });

  it("Should not be able to get all balance of user, if user not exists", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Samuel Craig",
      email: "rezgu@ifo.ph",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "rezgu@ifo.ph",
        password: "12345"
      });

    await usersRepository.deleteById(responseSession.body.user.id);

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });
})
