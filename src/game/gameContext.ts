import { createContext } from "react";
import type { PuzzleDataItem } from "@/types/socketEvents";

export interface IEncreuatGameContextProps {
  isInRoom: boolean;
  setInRoom: (v: boolean) => void;
  room: string;
  setRoom: (v: string) => void;
  playerSymbol: string;
  setPlayerSymbol: (v: string) => void;
  isPlayerTurn: boolean;
  setPlayerTurn: (v: boolean) => void;
  isGameStarted: boolean;
  setGameStarted: (v: boolean) => void;
  isPreparingGame: boolean;
  setPreparingGame: (v: boolean) => void;
  isGameEnded: boolean;
  setGameEnded: (v: boolean) => void;
  fase: number;
  setFase: (v: number) => void;
  playerRes: string;
  setPlayerRes: (v: string) => void;
  dades: PuzzleDataItem[];
  setDades: (v: PuzzleDataItem[]) => void;
  playerName: string;
  setPlayerName: (v: string) => void;
  playerAName: string;
  setPlayerAName: (v: string) => void;
  playerBName: string;
  setPlayerBName: (v: string) => void;
  matchId: string;
  setMatchId: (v: string) => void;
}

const defaultState: IEncreuatGameContextProps = {
  isInRoom: false,
  setInRoom: () => {},
  room: "",
  setRoom: () => {},
  playerSymbol: "",
  setPlayerSymbol: () => {},
  isPlayerTurn: false,
  setPlayerTurn: () => {},
  isGameStarted: false,
  setGameStarted: () => {},
  isPreparingGame: false,
  setPreparingGame: () => {},
  isGameEnded: false,
  setGameEnded: () => {},
  fase: 0,
  setFase: () => {},
  playerRes: "",
  setPlayerRes: () => {},
  dades: [],
  setDades: () => {},
  playerName: "",
  setPlayerName: () => {},
  playerAName: "",
  setPlayerAName: () => {},
  playerBName: "",
  setPlayerBName: () => {},
  matchId: "",
  setMatchId: () => {},
};

export default createContext(defaultState);
