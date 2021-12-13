import request from "supertest";
import createConnection from "../../../../database";

import { Connection } from "typeorm";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Get Statement Operation Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get statement operation", async () => {
    await request(app).post("/api/v1/users").send({
      name: "James Saunders",
      email: "eg@baeb.ml",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "eg@baeb.ml",
        password: "12345"
      });

    const deposit = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 600,
        description: "Create Deposit"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    const response = await request(app)
      .get(`/api/v1/statements/${deposit.body.id}`)
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.type).toBe("deposit");
    expect(response.body.user_id).toBe(responseSession.body.user.id);
  });

  it("Should not be able to get statement operation, if user not exists", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Leila Peters",
      email: "fedzoice@wuwju.cn",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "fedzoice@wuwju.cn",
        password: "12345"
      });

    const deposit = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 600,
        description: "Create Deposit"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    await usersRepository.deleteById(responseSession.body.user.id);

    const response = await request(app)
      .get(`/api/v1/statements/${deposit.body.id}`)
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("Should not be able to get statement operation, if not exists none statement operation", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Jared Pierce",
      email: "juvhis@ku.tp",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "juvhis@ku.tp",
        password: "12345"
      });

    const response = await request(app)
      .get(`/api/v1/statements/${responseSession.body.user.id}`)
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Statement not found");
  });
})
