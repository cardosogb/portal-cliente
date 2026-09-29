import cors from "cors";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { processesRouter } from "./routes/processes";
import { adminRouter } from "./routes/admin";
import { assertProductionSecrets } from "./auth";

assertProductionSecrets();

const app = express();
app.use(helmet());

// Em produção, só o(s) domínio(s) do site/app devem poder chamar a API —
// nunca "qualquer origem" (padrão do cors() sem opções).
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim());
app.use(
  cors(
    allowedOrigins
      ? { origin: allowedOrigins }
      : process.env.NODE_ENV === "production"
        ? { origin: false } // sem ALLOWED_ORIGINS configurado, bloqueia tudo em vez de liberar geral
        : undefined // dev local: libera geral, por conveniência
  )
);
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
