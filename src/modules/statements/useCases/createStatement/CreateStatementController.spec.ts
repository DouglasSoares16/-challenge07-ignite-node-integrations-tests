import createConnection from "../../../../database";
import request from "supertest";

import { Connection } from "typeorm";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to possible to perform the deposit operation", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Charlotte Henry",
      email: "ladsuhed@ubivafuj.gq",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "ladsuhed@ubivafuj.gq",
        password: "12345"
      });

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 500,
        description: "Create Deposit Test"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(500);
    expect(response.body.type).toBe("deposit");
  });

  it("Should be able to possible to perform the withdraw operation", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Dustin Norman",
      email: "suwuzo@be.org",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "suwuzo@be.org",
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

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 300,
        description: "Create Withdraw Test"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(300);
    expect(response.body.type).toBe("withdraw");
  });

  it("Should not be able to possible to perform any operations, if user does not exist", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Oscar Garcia",
      email: "dihze@hujeru.fk",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "dihze@hujeru.fk",
        password: "12345"
      });

    await usersRepository.deleteById(responseSession.body.user.id);

    const depositReponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 700,
        description: "Create Deposit Error"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    const withdrawResponse = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 400,
        description: "Create Withdraw Error"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(depositReponse.status).toBe(404);
    expect(withdrawResponse.status).toBe(404);

    expect(depositReponse.body.message).toBe("User not found")
    expect(withdrawResponse.body.message).toBe("User not found")
  });

  it("Should not be able to possible to perform the withdraw operation, if balance less than amount", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Oscar Garcia",
      email: "dihze@hujeru.fk",
      password: "12345"
    });

    const responseSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "dihze@hujeru.fk",
        password: "12345"
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 900,
        description: "Create Withdraw Error"
      })
      .set({
        Authorization: `Bearer ${responseSession.body.token}`
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient funds");
  });
})
