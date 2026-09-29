import cookieParser from "cookie-parser";
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
// nunca "qualquer origem" (padrão do cors() sem opções). `credentials: true`
// é necessário para o navegador enviar o cookie httpOnly de sessão; por
// isso `origin` nunca pode ser "*" aqui — em dev, `true` reflete a origem
// da própria requisição, o que ainda funciona com credentials.
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins ?? (process.env.NODE_ENV === "production" ? false : true),
    credentials: true,
  })
);
app.use(cookieParser());
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
