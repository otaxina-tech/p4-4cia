import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "CONTROLE DE MATERIAIS | 9ºB.C - 4ª CIA" },
      {
        name: "description",
        content:
          "Sistema de controle de entrega de materiais do efetivo do 9ºB.C - 4ª CIA, com validades e alertas de vencimento.",
      },
      { property: "og:title", content: "CONTROLE DE MATERIAIS | 9ºB.C - 4ª CIA" },
      {
        property: "og:description",
        content: "Acesse o controle de entregas, validades e vencimentos de materiais do efetivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => null,
});
