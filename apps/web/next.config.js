const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// CSP restrita: só permite carregar script/estilo/imagem do próprio site
// e chamar a API do portal — nada de terceiros. Isso limita bastante o
// estrago de um XSS (mesmo que algum script malicioso seja injetado na
// página, o navegador recusa a carregar/rodar coisa de fora dessa lista).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  // O site carrega a fonte (Fraunces/Work Sans) do Google Fonts — precisa
  // liberar esse domínio explicitamente, senão o navegador bloqueia.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data:",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' ${apiUrl}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@portal/shared"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // 2 anos + subdomínios + preload — depois do domínio no ar com
          // HTTPS funcionando, vale submeter em hstspreload.org.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        // Área de cliente/equipe: dado de gente de verdade, nunca deve
        // aparecer no Google nem em nenhum outro buscador.
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/processes/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

module.exports = nextConfig;
