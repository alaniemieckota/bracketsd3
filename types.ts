export interface BracketNode {
  id: string;
  name: string;
  children?: [BracketNode, BracketNode];
  player1: string | null;
  player2: string | null;
  winner: string | null;
  loser: string | null;
  round: number;
  matchInRound: number;
  sourceMatch1Id?: string;
  sourceMatch2Id?: string;
  player1Score: number[] | null;
  player2Score: number[] | null;
  player1SetsWon: number | null;
  player2SetsWon: number | null;
}

export interface BracketData {
  main: BracketNode;
  thirdPlace: BracketNode;
}
