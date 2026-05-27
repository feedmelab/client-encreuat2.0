import { useContext } from "react";
import { Loader2, Check, X as XIcon } from "lucide-react";
import gameContext from "@/game/gameContext";
import { useGameEngine } from "@/game/useGameEngine";
import { CountDown } from "./CountDown";
import type { PuzzleDataItem } from "@/types/socketEvents";

const isAutoProvidedChar = (c: string) => /[-’'·\s]/u.test(c);
const isFixedHintChar = (c: string, idx: number) => idx === 0 || isAutoProvidedChar(c);

export function EncreuatGame() {
  const {
    punts,
    chances,
    times,
    room,
    playerSymbol,
    fase,
    isPlayerTurn,
    isGameStarted,
    isGameEnded,
    playerRes,
    dades,
    playerAName,
    playerBName,
    getRoundIconClass,
    handleName,
    handleTimer,
    handleRemaining,
    handleChangeLetter,
    handleWordKeyDown,
    getCongratsGrade,
    updateGameChances,
    goToNewGame,
  } = useGameEngine();

  const myIdx = playerSymbol === "A" ? 0 : 1;
  const oppIdx = myIdx === 0 ? 1 : 0;
  const myScore = punts[myIdx];
  const oppScore = punts[oppIdx];
  const myName = (myIdx === 0 ? playerAName : playerBName) || "Tu";
  const oppName = (myIdx === 0 ? playerBName : playerAName) || "Contrincant";

  if (!isGameStarted && !isGameEnded) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="rounded-2xl bg-card border border-border shadow-soft p-8">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Sala oberta
          </div>
          <div className="font-display font-bold text-2xl tracking-wider mb-2">{room || "—"}</div>
          <p className="text-sm text-muted-foreground">
            Esperant un altre contrincant per a començar…
          </p>
        </div>
      </div>
    );
  }

  if (isGameEnded) {
    const iWon = myScore > oppScore;
    const tie = myScore === oppScore;

    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="rounded-2xl bg-card border border-border shadow-soft p-8 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Final de partida
          </div>
          <h2 className="font-display text-3xl font-bold mb-4">
            {tie
              ? punts[0] === 0
                ? "Si tu passes… jo també 😉"
                : "Taules! Bona partida"
              : iWon
                ? getCongratsGrade(myScore)
                : "Has perdut… Torna-hi!"}
          </h2>
          <div className="inline-flex items-stretch rounded-xl overflow-hidden border border-border">
            <div className={`px-6 py-3 ${iWon ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              <div className="text-[10px] uppercase opacity-70">{myName}</div>
              <div className="font-display font-bold text-2xl tabular">{myScore}</div>
            </div>
            <div
              className={`px-6 py-3 ${!iWon && !tie ? "bg-primary text-primary-foreground" : "bg-card"}`}
            >
              <div className="text-[10px] uppercase opacity-70">{oppName}</div>
              <div className="font-display font-bold text-2xl tabular">{oppScore}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-soft p-6">
          <h3 className="font-display font-semibold mb-3">Respostes per ronda</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1].map((pi) => {
              const name = pi === myIdx ? `${myName} (tu)` : oppName;
              return (
                <div key={pi} className="rounded-xl border border-border bg-background p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {name}
                  </div>
                  <ul className="space-y-1.5">
                    {chances.slice(0, 5).map((c, idx) => {
                      const val = c[pi];
                      const cls = getRoundIconClass(idx, pi as 0 | 1);
                      const wrong = cls === "wrong";
                      return (
                        <li key={idx} className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium truncate">
                            {val ? (
                              handleName(val, false)
                            ) : (
                              <span className="text-muted-foreground italic">—</span>
                            )}
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="tabular text-xs text-muted-foreground">
                              {times[idx]?.[pi] ?? "—"}s
                            </span>
                            {val ? (
                              wrong ? (
                                <XIcon className="h-4 w-4 text-destructive" />
                              ) : (
                                <Check
                                  className={`h-4 w-4 ${cls === "win" ? "text-success" : "text-accent-foreground"}`}
                                />
                              )
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-soft p-6">
          <h3 className="font-display font-semibold mb-3">Respostes correctes</h3>
          <ul className="space-y-3">
            {[...dades].slice(0, 5).map((d: PuzzleDataItem, i: number) => (
              <li key={i} className="border-l-2 border-accent pl-3">
                <div className="font-display font-semibold">{d?.d?.nom}</div>
                <p className="text-sm text-muted-foreground">
                  {d?.d?.tipus ? <span className="font-medium">[{d.d.tipus}] </span> : ""}
                  {d?.d?.descripcio}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={goToNewGame}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold tracking-wide hover:opacity-90 transition-all shadow-soft"
        >
          TORNAR A JUGAR
        </button>
      </div>
    );
  }

  // Playing
  const puzzle = dades?.[fase]?.d;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Sala {room}</div>
          <div className="font-display font-semibold">Ronda {fase + 1} / 5</div>
        </div>
        {isPlayerTurn && fase < 5 ? (
          <CountDown initialSeconds={60} onEnd={handleTimer} setRemaining={handleRemaining} />
        ) : (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Torn del contrincant
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[myIdx, oppIdx].map((pi) => {
          const me = pi === myIdx;
          const name = me ? myName : oppName;
          return (
            <div
              key={pi}
              className={`rounded-xl px-4 py-3 border transition-all ${
                me
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wide opacity-70">{name}</div>
              <div className="flex items-center justify-between">
                <div className="font-display font-bold text-xl tabular">{punts[pi]}</div>
                <div className="flex gap-1">
                  {chances.slice(0, 5).map((c, idx) => {
                    const filled = c[pi] !== null;
                    const active = idx === fase && !filled;
                    return (
                      <span
                        key={idx}
                        className={`h-2 w-2 rounded-full ${
                          filled
                            ? me
                              ? "bg-primary-foreground"
                              : "bg-foreground"
                            : active
                              ? "bg-accent"
                              : "bg-border"
                        } ${active ? "animate-pulse-soft" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isPlayerTurn && fase < 5 && puzzle && (
        <>
          <div className="rounded-2xl bg-card border border-border shadow-soft p-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Definició
            </div>
            <p className="font-display text-xl sm:text-2xl leading-snug">
              {puzzle.tipus ? (
                <span className="text-muted-foreground text-base">[{puzzle.tipus}] </span>
              ) : null}
              {puzzle.descripcio}
            </p>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-soft p-5">
            <div
              className="flex flex-wrap justify-center gap-1.5"
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            >
              {puzzle.nom.split("").map((x: string, index: number) => {
                const fixed = isFixedHintChar(x, index);
                const isSep = /[\s]/.test(x);
                if (isSep) return <span key={`${fase}-${index}`} className="w-3" />;
                return (
                  <input
                    key={`${fase}-${index}`}
                    type="text"
                    name={`ssn-${index}`}
                    maxLength={1}
                    autoFocus={index === 1}
                    id={String(puzzle.nom.length)}
                    defaultValue={fixed ? x : ""}
                    disabled={fixed}
                    onChange={handleChangeLetter}
                    onKeyDown={handleWordKeyDown}
                    className={`h-11 w-9 sm:h-12 sm:w-10 rounded-md border text-center font-display font-bold text-lg sm:text-xl uppercase
                      transition-all focus:outline-none focus:shadow-glow focus:border-primary
                      ${fixed ? "bg-accent/40 border-accent text-accent-foreground" : "bg-background border-border text-foreground"}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                updateGameChances(e, fase, myIdx, "Passo")
              }
              className="py-3 rounded-xl bg-secondary text-secondary-foreground font-display font-semibold hover:opacity-90 transition-all"
            >
              PASSAR
            </button>
            <button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                updateGameChances(e, fase, myIdx, playerRes)
              }
              className="py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-all shadow-soft"
            >
              ENVIAR
            </button>
          </div>
        </>
      )}

      {!isPlayerTurn && (
        <div className="rounded-2xl bg-card border border-border shadow-soft p-10 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Esperant la jugada del contrincant…</p>
        </div>
      )}
    </div>
  );
}
