import { app } from "../../../../app";
import request from "supertest";
import { Connection } from "typeorm";
import createConnection from "../../../../database";

let connection: Connection;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to authenticate a user", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Sue Hopkins",
      email: "hezwak@lefi.bd",
      password: "12345"
    });

    const response = await request(app).post("/api/v1/sessions").send({
      email: "hezwak@lefi.bd",
      password: "12345"
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toHaveProperty("id");
  });

  it("Should not be able to authenticate a user, if user does not exists", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "gizcidevo@rufbobvec.lr",
      password: "12345"
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Incorrect email or password");
  });

  it("Should not be able to authenticate a user, if the passwords don't match", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Tom Roberts",
      email: "mozwo@fup.rs",
      password: "12345"
    });

    const response = await request(app).post("/api/v1/sessions").send({
      email: "mozwo@fup.rs",
      password: "password incorrect"
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Incorrect email or password");
  });
})
