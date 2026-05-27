import React, { useCallback, useContext, useEffect, useState } from "react";
import gameContext from "./gameContext";
import gameService from "@/services/gameService";
import socketService from "@/services/socketService";
import type { IPlayerRespostes, IPlayerResultats, IPlayerTimes } from "@/types/socketEvents";

export function useGameEngine() {
  const [punts, setPunts] = useState<Array<number>>([0, 0]);
  const [resultatFinal, setresultatFinal] = useState<IPlayerResultats>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [chances, setChances] = useState<IPlayerRespostes>([
    [null, null],
    [null, null],
    [null, null],
    [null, null],
    [null, null],
    [0],
  ]);
  const [times, setTimes] = useState<IPlayerTimes>([
    [null, null],
    [null, null],
    [null, null],
    [null, null],
    [null, null],
  ]);
  const {
    room,
    playerSymbol,
    setInRoom,
    fase,
    setFase,
    setPlayerTurn,
    isPlayerTurn,
    isGameStarted,
    isGameEnded,
    setGameEnded,
    playerRes,
    setPlayerRes,
    dades,
    playerAName,
    playerBName,
    matchId,
    setGameStarted,
    setRoom,
  } = useContext(gameContext);

  const [remaining, setRemaining] = useState<number | null>(null);
  const [reportedWinner, setReportedWinner] = useState<string>("");
  const timeToPlay = 60;

  const normalizeForCompare = (value: unknown) =>
    String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .trim();

  const isAllowedCatalanChar = (v: string) => /^[A-Za-zÀ-ÖØ-öø-ÿÇç·'’-]$/u.test(v);
  const isAutoProvidedChar = (v: string) => /[-’'·\s]/u.test(v);

  const getCurrentTypedWord = (totalFields: number) =>
    Array.from({ length: totalFields })
      .map(
        (_, idx) =>
          (
            document.querySelector(`input[name=ssn-${idx}]`) as HTMLInputElement | null
          )?.value?.toLowerCase() || "",
      )
      .join("");

  const findPreviousEditableInput = (fromIndex: number) => {
    for (let idx = fromIndex; idx >= 0; idx -= 1) {
      const c = document.querySelector(`input[name=ssn-${idx}]`) as HTMLInputElement | null;
      if (c && !c.disabled) return c;
    }
    return null;
  };
  const findNextEditableInput = (fromIndex: number, totalFields: number) => {
    for (let idx = fromIndex; idx < totalFields; idx += 1) {
      const c = document.querySelector(`input[name=ssn-${idx}]`) as HTMLInputElement | null;
      if (c && !c.disabled) return c;
    }
    return null;
  };

  const recomputeResults = useCallback(
    (nextChances: IPlayerRespostes, nextTimes: IPlayerTimes) => {
      const nextResultatFinal: IPlayerResultats = [null, null, null, null, null];
      const nextPunts = [0, 0];
      for (let round = 0; round < 5; round++) {
        const t0 = nextTimes?.[round]?.[0];
        const t1 = nextTimes?.[round]?.[1];
        if (t0 === null || t1 === null || t0 === undefined || t1 === undefined) continue;
        const timeWinner = Number(t0) === Number(t1) ? "AB" : Number(t0) < Number(t1) ? "A" : "B";
        const expected = normalizeForCompare(dades?.[round]?.d?.nom);
        const a0 = normalizeForCompare(nextChances?.[round]?.[0]);
        const a1 = normalizeForCompare(nextChances?.[round]?.[1]);
        const aCorrect = expected && a0 !== "passo" && a0 === expected;
        const bCorrect = expected && a1 !== "passo" && a1 === expected;
        const winners: Array<"A" | "B"> = [];
        if (aCorrect) winners.push("A");
        if (bCorrect) winners.push("B");
        if (winners.length === 2) {
          nextResultatFinal[round] = timeWinner;
          if (timeWinner === "A") nextPunts[0] += 3;
          else if (timeWinner === "B") nextPunts[1] += 3;
          else {
            nextPunts[0] += 1;
            nextPunts[1] += 1;
          }
        } else if (winners.length === 1) {
          nextResultatFinal[round] = winners[0];
          if (winners[0] === "A") nextPunts[0] += 3;
          else nextPunts[1] += 3;
        }
      }
      setresultatFinal(nextResultatFinal);
      setPunts(nextPunts);
    },
    [dades],
  );

  const isGameFinishedFromState = (nc: IPlayerRespostes) => {
    const f = Number(nc?.[5]?.[0]) || 0;
    const last = nc?.[4]?.every((r) => r !== null) || false;
    return f >= 5 || last;
  };

  const updateGameChances = async (
    event: React.FormEvent | null,
    currentFase: number,
    puntero: number,
    resposta: string,
  ) => {
    if (event) event.preventDefault();
    if (resposta === "") resposta = "Passo";
    if (currentFase >= 5) return;

    const newChances = [...chances];
    const newTimes = [...times];
    if (newChances[currentFase][puntero] === "" || newChances[currentFase][puntero] === null) {
      newChances[currentFase][puntero] = resposta;
      newTimes[currentFase][puntero] = remaining;
      setChances(newChances);
      setTimes(newTimes);
      recomputeResults(newChances, newTimes);
      setFase(Number(newChances?.[5]?.[0]) || 0);
    }
    const finished = isGameFinishedFromState(newChances);
    if (socketService.socket) {
      gameService.updateGame(socketService.socket, newChances, newTimes);
      if (finished) {
        setPlayerTurn(false);
        setGameEnded(true);
      } else setPlayerTurn(false);
      setPlayerRes("");
    }
  };

  const isRoundCorrect = (round: number, p: 0 | 1) => {
    const a = chances[round]?.[p];
    const expected = dades?.[round]?.d?.nom;
    if (!a || a === "Passo" || !expected) return false;
    return normalizeForCompare(a) === normalizeForCompare(expected);
  };

  const getRoundIconClass = (round: number, p: 0 | 1) => {
    if (!isRoundCorrect(round, p)) return "wrong";
    const w = resultatFinal[round];
    if (w === "AB") return "win";
    if (w === "A") return p === 0 ? "win" : "correct";
    if (w === "B") return p === 1 ? "win" : "correct";
    return "correct";
  };

  const handleName = (name: string | number | null, mask: boolean) => {
    if (name === null || name === undefined) return "";
    const v = String(name);
    return mask ? v.replace(/[a-zA-ZÀ-ú]/gi, "*") : v;
  };

  const handleTimer = () => {
    if (fase < 5) updateGameChances(null, fase, playerSymbol === "A" ? 0 : 1, "Passo");
  };
  const handleRemaining = (r = 0) => {
    if (r) setRemaining(timeToPlay - (r - 1));
  };

  const handleChangeLetter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { maxLength, name, id } = e.target;
    const { value } = e.target;
    const [, fieldIndex] = name.split("-");
    if (isAutoProvidedChar(value)) return;
    if (!value) return;
    const latest = value[value.length - 1];
    if (!isAllowedCatalanChar(latest)) {
      e.target.value = "";
      return;
    }
    e.target.value = latest;
    if (value.length < maxLength) return;
    if (parseInt(fieldIndex, 10) < Number(id)) {
      const total = Number(id) || 0;
      const chars = getCurrentTypedWord(total);
      setPlayerRes(chars);
      const next = findNextEditableInput(parseInt(fieldIndex, 10) + 1, total);
      if (next) next.focus();
    }
  };

  const handleWordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const [, fieldIndexRaw] = input.name.split("-");
    const fieldIndex = Number(fieldIndexRaw) || 0;
    if (e.key.length === 1 && !isAllowedCatalanChar(e.key) && e.key !== "Backspace")
      e.preventDefault();
    if (e.key === "Backspace" && input.value === "" && fieldIndex > 0) {
      const prev = findPreviousEditableInput(fieldIndex - 1);
      if (prev) {
        prev.value = "";
        prev.focus();
      }
    }
    const total = Number(input.id) || 0;
    const chars = getCurrentTypedWord(total);
    setPlayerRes(chars);
  };

  const getCongratsGrade = (score: number) =>
    score > 10
      ? "Enhorabona! Has guanyat amb una puntuació espectacular!"
      : score < 5
        ? "Enhorabona! Has guanyat... però pels pèls ;)"
        : "Enhorabona! Has guanyat la partida!";

  useEffect(() => {
    let unsubGU: (() => void) | null = null;
    let unsubGF: (() => void) | null = null;
    const unsubC = socketService.onConnected((socket) => {
      if (unsubGU) unsubGU();
      if (unsubGF) unsubGF();
      unsubGU = gameService.onGameUpdate(socket, (nc, nt) => {
        setChances(nc);
        setTimes(nt);
        recomputeResults(nc, nt);
        setFase(Number(nc[5][0]) || 0);
        if (isGameFinishedFromState(nc)) {
          setPlayerTurn(false);
          setGameEnded(true);
        } else setPlayerTurn(true);
      });
      unsubGF = gameService.onGameFinished(socket, (nc, nt) => {
        setChances(nc);
        setTimes(nt);
        recomputeResults(nc, nt);
        setFase(Number(nc?.[5]?.[0]) || 0);
        setPlayerTurn(false);
        setGameEnded(true);
      });
    });
    return () => {
      unsubC();
      if (unsubGU) unsubGU();
      if (unsubGF) unsubGF();
    };
  }, [recomputeResults, setFase, setGameEnded, setPlayerTurn]);

  useEffect(() => {
    if (!isGameEnded || reportedWinner) return;
    if (!socketService.socket || playerSymbol !== "A") return;
    let winnerName = "",
      winnerPoints = 0;
    if (punts[0] > punts[1]) winnerName = playerAName;
    else if (punts[1] > punts[0]) winnerName = playerBName;
    if (winnerName === playerAName) winnerPoints = punts[0];
    if (winnerName === playerBName) winnerPoints = punts[1];
    if (!winnerName) return;
    gameService.reportWinner(socketService.socket, winnerName, matchId || room, winnerPoints);
    setReportedWinner(winnerName);
  }, [isGameEnded, reportedWinner, punts, playerAName, playerBName, playerSymbol, room, matchId]);

  const goToNewGame = async () => {
    if (socketService.socket && room)
      await gameService.cancelGameRoom(socketService.socket, room).catch(() => {});
    setInRoom(false);
    setGameEnded(false);
    setGameStarted(false);
    setPlayerTurn(false);
    setRoom("");
    setFase(0);
    setPlayerRes("");
    setReportedWinner("");
  };

  return {
    punts,
    resultatFinal,
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
  };
}
