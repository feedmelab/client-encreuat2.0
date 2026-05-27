import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameApp } from "@/components/game/GameApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Encreua't — Joc de paraules en català" },
      {
        name: "description",
        content:
          "Dedueix la paraula a partir de la pista. Joc de paraules en català en sales online: solitari o per a dos jugadors, 5 rondes contra el temps.",
      },
      { property: "og:title", content: "Encreua't — Joc de paraules" },
      {
        property: "og:description",
        content:
          "Crea una sala o uneix-te a una partida oberta. Endevina la paraula amb les pistes de l'IEC.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  // socket.io-client must run only in browser (TanStack Start SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      {mounted ? (
        <GameApp />
      ) : (
        <div className="mx-auto w-full max-w-md text-center">
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 animate-pulse-soft">
            <h1 className="font-display text-3xl font-bold">Encreua't</h1>
            <p className="mt-2 text-sm text-muted-foreground">Carregant…</p>
          </div>
        </div>
      )}
    </main>
  );
}
