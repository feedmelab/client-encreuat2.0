export interface RoomListItem {
  roomId: string;
  status: "waiting" | "started";
  players: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface RoomJoinedEvent {
  roomId: string;
  players?: number;
}

export interface RoomErrorEvent {
  error: string;
}

export interface WinnersBoardRow {
  name: string;
  wins: number;
  points: number;
}

export interface WinnersBoardEvent {
  board: WinnersBoardRow[];
}

export interface PuzzleDataItem {
  d: {
    nom: string;
    tipus?: string;
    descripcio?: string;
  };
}

export type IPlayerRespostes = Array<Array<string | number | null>>;
export type IPlayerResultats = Array<string | null>;
export type IPlayerTimes = Array<Array<string | number | null>>;

export interface IStartJoc {
  start: boolean;
  symbol: "A" | "B";
  room: string;
  dades: PuzzleDataItem[];
  players?: { A: string; B: string };
  matchId?: string;
}
