import supertest from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { app } from "../src/app";
import { execSync } from "node:child_process";

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  execSync("npm run knex migrate:rollback --all");
  execSync("npm run knex migrate:latest");
});

describe("Transactions Routes", () => {
  test("Usuario deve ser capaz de criar uma transação", async () => {
    const response = await supertest(app.server).post("/transactions").send({
      title: "New Transaction",
      amount: 5000,
      type: "credit",
    });
    expect(response.statusCode).toEqual(201);
  });

  test("deve ser possivel listar todas transaçoes", async () => {
    const createResponse = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createResponse.get("Set-Cookie");

    const listResponse = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies);

    expect(listResponse.statusCode).toEqual(200);
    expect(listResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New Transaction",
        amount: 5000,
      }),
    ]);
  });

  test("deve ser possivel listar apenas uma transação", async () => {
    const createResponse = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createResponse.get("Set-Cookie");

    const listResponse = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies);

    const transactionId = listResponse.body.transactions[0].id;

    const transactionResponse = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies);

    expect(transactionResponse.statusCode).toEqual(200);
    expect(transactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "New Transaction",
        amount: 5000,
      })
    );
  });


  test("deve ser possivel listar ter o sumario das transacoes", async () => {
    const createResponse = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createResponse.get("Set-Cookie");

    await supertest(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction debit",
        amount: 2500,
        type: "debit",
      }).set("Cookie", cookies);;

    const summaryResponse = await supertest(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies);

      expect(summaryResponse.statusCode).toEqual(200)
      expect(summaryResponse.body.summary.amount).toEqual(2500)
  });

});
