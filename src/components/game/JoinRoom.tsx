import { useContext, useEffect, useState } from "react";
import { User, Users, LogIn, Trophy, X, Pencil } from "lucide-react";
import gameContext from "@/game/gameContext";
import gameService from "@/services/gameService";
import socketService from "@/services/socketService";
import type { RoomListItem, WinnersBoardRow } from "@/types/socketEvents";

export function JoinRoom() {
  const [roomName, setRoomName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [localName, setLocalName] = useState("");
  const [isJoining, setJoining] = useState(false);
  const [openGames, setOpenGames] = useState<RoomListItem[]>([]);
  const [winnersBoard, setWinnersBoard] = useState<WinnersBoardRow[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);

  const { setRoom, room, playerName, setPlayerName, isPreparingGame, setPreparingGame } =
    useContext(gameContext);

  useEffect(() => {
    if (playerName && !localName) setLocalName(playerName);
  }, [playerName, localName]);

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketService.socket;
    if (!playerName || !roomName.trim() || !socket) return;
    setJoining(true);
    const id = await gameService
      .joinGameRoomWithNameAndDifficulty(socket, roomName, playerName, difficulty)
      .catch((err) => alert(err));
    if (id) setRoom(id);
    setJoining(false);
  };

  const joinOpenedGame = async (roomId: string) => {
    const socket = socketService.socket;
    if (!socket || !playerName) return;
    setJoining(true);
    const id = await gameService
      .joinGameRoomWithName(socket, roomId, playerName)
      .catch((err) => alert(err));
    if (id) setRoom(id);
    setJoining(false);
  };

  const startSoloGame = async () => {
    const socket = socketService.socket;
    if (!socket || !playerName) return;
    setJoining(true);
    setPreparingGame(true);
    const id = await gameService.createSoloGameRoom(socket, playerName, difficulty).catch((err) => {
      alert(err);
      setPreparingGame(false);
    });
    if (id) setRoom(id);
    setJoining(false);
  };

  const saveName = () => {
    const s = localName.trim();
    if (!s) return;
    setPlayerName(s);
    if (typeof window !== "undefined") localStorage.setItem("encreuat_player_name", s);
    setIsEditingName(false);
  };

  const cancelCreatedGame = async () => {
    const socket = socketService.socket;
    if (!socket || !room) return;
    setJoining(true);
    const cancelledId = await gameService.cancelGameRoom(socket, room).catch((err) => alert(err));
    if (cancelledId) {
      setRoom("");
      setRoomName("");
      setPreparingGame(false);
    }
    setJoining(false);
  };

  useEffect(() => {
    let unsubG: (() => void) | null = null;
    const unsubC = socketService.onConnected((socket) => {
      if (unsubG) unsubG();
      unsubG = gameService.onOpenGames(socket, (rooms) => setOpenGames(rooms));
      gameService.requestOpenGames(socket);
    });
    return () => {
      unsubC();
      if (unsubG) unsubG();
    };
  }, []);

  useEffect(() => {
    let unsubL: (() => void) | null = null;
    const unsubC = socketService.onConnected((socket) => {
      if (unsubL) unsubL();
      unsubL = gameService.onLeaderboardUpdate(socket, (b) => setWinnersBoard(b));
      gameService.requestLeaderboard(socket);
    });
    return () => {
      unsubC();
      if (unsubL) unsubL();
    };
  }, []);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;
    const onErr = () => setPreparingGame(false);
    socket.on("room_join_error", onErr);
    return () => {
      socket.off("room_join_error", onErr);
    };
  }, [setPreparingGame]);

  const showNameForm = !playerName || isEditingName;
  const showLobby = playerName && !room && !isEditingName;
  const parseDifficulty = (value: string): "easy" | "medium" | "hard" =>
    value === "easy" || value === "hard" ? value : "medium";

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <header className="text-center mb-2">
        <div className="inline-block mb-3 px-3 py-1 rounded-full bg-accent/40 text-accent-foreground text-xs font-medium tracking-wide uppercase">
          Joc de paraules en català
        </div>
        <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight">Encreua't</h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          Dedueix les paraules a partir de les seves descripcions. 5 rondes contra el temps.
        </p>
      </header>

      {showNameForm && (
        <section className="rounded-2xl bg-card border border-border shadow-soft p-6">
          <h2 className="text-lg font-display font-semibold mb-3">
            {playerName ? "Edita el teu nom" : "Primer pas: escriu el teu nom"}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Nom o pseudònim"
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:shadow-glow font-medium"
            />
            <button
              type="submit"
              disabled={!localName.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold disabled:opacity-40 transition-all"
            >
              GUARDAR
            </button>
            {playerName && (
              <button
                type="button"
                onClick={() => {
                  setLocalName(playerName);
                  setIsEditingName(false);
                }}
                className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium"
              >
                Cancel·lar
              </button>
            )}
          </form>
        </section>
      )}

      {showLobby && (
        <>
          <section className="rounded-2xl bg-card border border-border shadow-soft p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Jugador</div>
                <div className="font-display font-semibold text-lg">{playerName}</div>
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            </div>

            <form onSubmit={joinRoom} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder="ID de sala"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                  className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:shadow-glow font-medium uppercase tracking-wider"
                />
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseDifficulty(e.target.value))}
                  className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:shadow-glow font-medium"
                >
                  <option value="easy">Dificultat: fàcil</option>
                  <option value="medium">Dificultat: mitjana</option>
                  <option value="hard">Dificultat: difícil</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isJoining}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold disabled:opacity-50 transition-all shadow-soft"
                >
                  <Users className="h-4 w-4" />
                  {isJoining ? "CONECTANT…" : "ENCREUA'T (2 jug.)"}
                </button>
                <button
                  type="button"
                  disabled={isJoining}
                  onClick={startSoloGame}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-display font-semibold disabled:opacity-50 transition-all"
                >
                  <User className="h-4 w-4" />
                  {isJoining ? "PREPARANT…" : "JUGAR SOL/A"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-card border border-border shadow-soft p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Partides obertes</h3>
              <span className="text-xs text-muted-foreground">{openGames.length} disponibles</span>
            </div>
            {openGames.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hi ha cap partida oberta ara mateix.
              </p>
            ) : (
              <ul className="space-y-2">
                {openGames.map((r) => (
                  <li
                    key={r.roomId}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold tracking-wide truncate">
                        {r.roomId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.players}/2 · {r.status === "started" ? "En joc" : "Disponible"} ·{" "}
                        {r.difficulty === "easy"
                          ? "Fàcil"
                          : r.difficulty === "hard"
                            ? "Difícil"
                            : "Mitjana"}
                      </div>
                    </div>
                    {r.status === "waiting" ? (
                      <button
                        onClick={() => joinOpenedGame(r.roomId)}
                        disabled={isJoining}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                      >
                        <LogIn className="h-3.5 w-3.5" /> Entrar
                      </button>
                    ) : (
                      <span className="px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                        En joc
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {room && (
        <section className="rounded-2xl bg-card border border-border shadow-soft p-6 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Sala oberta
          </div>
          <div className="font-display font-bold text-3xl tracking-wider mb-3">{room}</div>
          <p className="text-sm text-muted-foreground mb-4">
            {isPreparingGame
              ? "Preparant partida: carregant definicions vàlides…"
              : "Esperant que un altre jugador entri a aquesta sala per començar."}
          </p>
          <div className="flex justify-center">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse-soft" />
          </div>
          <button
            onClick={cancelCreatedGame}
            disabled={isJoining}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Eliminar joc
          </button>
        </section>
      )}

      <section className="rounded-2xl bg-card border border-border shadow-soft p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-accent-foreground" />
          <h3 className="font-display font-semibold">Guanyadors freqüents</h3>
        </div>
        {winnersBoard.length === 0 ? (
          <p className="text-sm text-muted-foreground">Encara no hi ha partides registrades.</p>
        ) : (
          <ol className="space-y-1.5">
            {winnersBoard.slice(0, 10).map((w, i) => (
              <li key={`${w.name}-${i}`} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-muted-foreground tabular w-6 inline-block">{i + 1}.</span>{" "}
                  <span className="font-medium">{w.name}</span>
                </span>
                <span className="tabular text-muted-foreground">
                  {w.wins} v. · {w.points} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
