import { app } from "../../../../app";
import request from "supertest";
import { Connection } from "typeorm";
import createConnection from "../../../../database";
import { UsersRepository } from "../../repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Show User Profile Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();
    usersRepository = new UsersRepository();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to show profile of the user", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Ellen Greer",
      email: "vuipu@bige.lv",
      password: "12345"
    });

    const responseSession = await request(app).post("/api/v1/sessions").send({
      email: "vuipu@bige.lv",
      password: "12345"
    });

    const { token } = responseSession.body;

    const profile = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(profile.body).toHaveProperty("id");
    expect(profile.body.email).toBe("vuipu@bige.lv");
  });

  it("Should not be able to show profile of the user, if user does not exists", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Milton Casey",
      email: "zuk@fuegnug.nz",
      password: "12345"
    });

    const responseSession = await request(app).post("/api/v1/sessions").send({
      email: "zuk@fuegnug.nz",
      password: "12345"
    });

    const { token } = responseSession.body;

    await usersRepository.deleteById(responseSession.body.user.id);

    const profile = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(profile.status).toBe(404);
    expect(profile.body.message).toBe("User not found");
  });
})
