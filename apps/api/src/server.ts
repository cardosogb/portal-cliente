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

// Atrás de um proxy reverso (Render, Heroku, Nginx etc.), a API enxerga
// sempre HTTP na conexão interna — é o cabeçalho X-Forwarded-Proto que diz
// se o visitante usou HTTPS de verdade. Isso precisa estar configurado
// antes do redirecionamento abaixo, senão a API nunca vê "https" e entra
// em loop de redirecionamento.
app.set("trust proxy", 1);

app.use(
  helmet({
    // HSTS forte (2 anos + subdomínios + preload): depois do domínio no ar
    // com HTTPS funcionando, vale submeter em hstspreload.org — aí até a
    // primeira visita de cada pessoa já vem forçada em HTTPS, sem depender
    // desse cabeçalho ter chegado uma vez antes.
    strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
  })
);

// Força HTTPS em produção — helmet só manda o navegador preferir HTTPS
// depois da primeira visita (HSTS); isso aqui recusa HTTP já na primeira.
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure || req.get("x-forwarded-proto") === "https") return next();
    return res.redirect(301, `https://${req.get("host")}${req.originalUrl}`);
  });
}

// Google (e qualquer scanner de segurança) não deve indexar respostas de
// uma API — ela não é uma página pra aparecer em busca.
app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

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

/**
 * security.txt (RFC 9116): onde um pesquisador de segurança avisa sobre
 * uma falha encontrada, sem precisar adivinhar um e-mail. É um dos itens
 * que escâneres de "site seguro" (e o próprio Google) checam.
 */
app.get("/.well-known/security.txt", (_req, res) => {
  res.type("text/plain").send(
    [
      "Contact: mailto:ti@fernandomiranda.adv.br",
      "Expires: 2027-12-31T23:59:59.000Z",
      "Preferred-Languages: pt-BR, en",
    ].join("\n")
  );
});

app.use("/auth", authRouter);
app.use("/processes", processesRouter);
app.use("/admin", adminRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] Portal do Cliente API rodando em http://localhost:${PORT}`);
});
