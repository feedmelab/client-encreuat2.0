import { useEffect, useRef, useState } from "react";
import gameContext, { IEncreuatGameContextProps } from "@/game/gameContext";
import socketService from "@/services/socketService";
import gameService from "@/services/gameService";
import { JoinRoom } from "@/components/game/JoinRoom";
import { EncreuatGame } from "@/components/game/EncreuatGame";
import type { PuzzleDataItem } from "@/types/socketEvents";

const SERVER_URL = "https://api-encreuat.feedmelab.com";

export function GameApp() {
  const [isInRoom, setInRoom] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<string>("");
  const [isPlayerTurn, setPlayerTurn] = useState(false);
  const [isGameStarted, setGameStarted] = useState(false);
  const [isPreparingGame, setPreparingGame] = useState(false);
  const [isGameEnded, setGameEnded] = useState(false);
  const [dades, setDades] = useState<PuzzleDataItem[]>([]);
  const [room, setRoom] = useState<string>("");
  const [fase, setFase] = useState<number>(0);
  const [playerRes, setPlayerRes] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [playerAName, setPlayerAName] = useState<string>("");
  const [playerBName, setPlayerBName] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const didTryAutoRejoin = useRef(false);

  // Hydrate name from localStorage (client only)
  useEffect(() => {
    const saved = localStorage.getItem("encreuat_player_name") || "";
    if (saved) setPlayerName(saved);
  }, []);

  // Persist active room
  useEffect(() => {
    if (room) localStorage.setItem("encreuat_active_room", room);
    else localStorage.removeItem("encreuat_active_room");
  }, [room]);

  // Connect socket (client only)
  useEffect(() => {
    socketService.connect(SERVER_URL).catch((err) => console.error("connect failed", err));
  }, []);

  // Game start/preparing listeners + auto-rejoin
  useEffect(() => {
    let unsubStart: (() => void) | null = null;
    let unsubPrep: (() => void) | null = null;
    const unsubC = socketService.onConnected((socket) => {
      if (!didTryAutoRejoin.current) {
        didTryAutoRejoin.current = true;
        const savedRoom = String(localStorage.getItem("encreuat_active_room") || "")
          .trim()
          .toUpperCase();
        const savedName = String(localStorage.getItem("encreuat_player_name") || "").trim();
        if (savedRoom && savedName) {
          setPreparingGame(true);
          gameService
            .joinGameRoomWithName(socket, savedRoom, savedName)
            .then((id) => {
              if (id) setRoom(id);
            })
            .catch(() => {
              localStorage.removeItem("encreuat_active_room");
              setPreparingGame(false);
            });
        }
      }
      if (unsubStart) unsubStart();
      if (unsubPrep) unsubPrep();
      unsubPrep = gameService.onGamePreparing(socket, () => setPreparingGame(true));
      unsubStart = gameService.onStartGame(socket, (options) => {
        setDades(options.dades);
        setGameStarted(true);
        setPreparingGame(false);
        setPlayerSymbol(options.symbol);
        setRoom(options.room);
        setPlayerAName(options?.players?.A || "");
        setPlayerBName(options?.players?.B || "");
        setMatchId(options?.matchId || "");
        setPlayerTurn(!!options.start);
        setInRoom(true);
      });
    });
    return () => {
      unsubC();
      if (unsubStart) unsubStart();
      if (unsubPrep) unsubPrep();
    };
  }, []);

  const value: IEncreuatGameContextProps = {
    isInRoom,
    setInRoom,
    playerSymbol,
    setPlayerSymbol,
    isPlayerTurn,
    setPlayerTurn,
    isGameStarted,
    setGameStarted,
    isPreparingGame,
    setPreparingGame,
    isGameEnded,
    setGameEnded,
    room,
    setRoom,
    fase,
    setFase,
    playerRes,
    setPlayerRes,
    dades,
    setDades,
    playerName,
    setPlayerName,
    playerAName,
    setPlayerAName,
    playerBName,
    setPlayerBName,
    matchId,
    setMatchId,
  };

  return (
    <gameContext.Provider value={value}>
      {!isInRoom ? <JoinRoom /> : <EncreuatGame />}
    </gameContext.Provider>
  );
}
