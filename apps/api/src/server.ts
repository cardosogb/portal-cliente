import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth";
import { processesRouter } from "./routes/processes";
import { adminRouter } from "./routes/admin";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/processes", processesRouter);
app.use("/admin", adminRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] Portal do Cliente API rodando em http://localhost:${PORT}`);
});
