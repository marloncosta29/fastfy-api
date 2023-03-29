import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkSessionIdExists } from "../midlewares/check-sessionId-exist";

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: checkSessionIdExists }, async (request) => {
    const { sessionId } = request.cookies;
    const transactions = await knex("transactions")
      .where("session_id", sessionId)
      .select();
    return { transactions };
  });

  app.get("/:id",{ preHandler: checkSessionIdExists }, async (request) => {
    const getTransactionSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionSchema.parse(request.params);
    const { sessionId } = request.cookies;

    const transaction = await knex("transactions")
      .where({ id: id, session_id: sessionId })
      .first();

    return { transaction };
  });

  app.get("/summary", { preHandler: checkSessionIdExists },async (request) => {
    const { sessionId } = request.cookies;

    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", { as: "amount" })
      .first();
    return { summary };
  });

  app.post("/", async (request, response) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });
    const { title, amount, type } = createTransactionSchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      response.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });
    return response.status(201).send();
  });
}
