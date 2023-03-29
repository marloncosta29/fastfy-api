import fastfy from "fastify";
import cookie from "@fastify/cookie";
import { transactionsRoutes } from "./routes/transactionRoutes";

const app = fastfy();

app.register(cookie);
app.register(transactionsRoutes, { prefix: "transactions" });

export { app };
