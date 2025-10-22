import { BracketNode } from '../types';

export const initialPlayers = [
  "Novak Djokovic", "Carlos Alcaraz", "Daniil Medvedev", "Jannik Sinner",
  "Stefanos Tsitsipas", "Alexander Zverev", "Andrey Rublev", "Holger Rune",
  "Casper Ruud", "Taylor Fritz", "Frances Tiafoe", "Felix Auger-Aliassime",
  "Hubert Hurkacz", "Cameron Norrie", "Tommy Paul", "Borna Coric",
  "Lorenzo Musetti", "Alex de Minaur", "Matteo Berrettini", "Denis Shapovalov",
  "Karen Khachanov", "Roberto Bautista Agut", "Grigor Dimitrov", "BYE",
  "Sebastian Korda", "Daniel Evans", "Yoshihito Nishioka", "BYE",
  "Ben Shelton", "Miomir Kecmanovic", "Alejandro Davidovich Fokina", "BYE"
];

const BYE = "BYE";

const generateScores = (): { player1Score: number[], player2Score: number[], player1SetsWon: number, player2SetsWon: number } => {
    const p1Scores: number[] = [];
    const p2Scores: number[] = [];
    let p1SetsWon = 0;
    let p2SetsWon = 0;
    
    const p2TargetWins = Math.floor(Math.random() * 3); // 0, 1, or 2 sets for the loser

    while (p1SetsWon < 3 && p2SetsWon < 3) {
        let p1SetScore = Math.floor(Math.random() * 6) + 21; // Random score between 21-26
        let p2SetScore = Math.floor(Math.random() * 6) + 21;
        if (p1SetScore === p2SetScore) p1SetScore++; // Ensure no ties in a set

        // Assign set winner based on pre-determined match outcome
        if (p2SetsWon < p2TargetWins) {
            // Give set to p2
            if (p1SetScore > p2SetScore) [p1SetScore, p2SetScore] = [p2SetScore, p1SetScore];
            p2SetsWon++;
        } else {
            // Give set to p1
            if (p1SetScore < p2SetScore) [p1SetScore, p2SetScore] = [p2SetScore, p1SetScore];
            p1SetsWon++;
        }
        p1Scores.push(p1SetScore);
        p2Scores.push(p2SetScore);
    }

    return { player1Score: p1Scores, player2Score: p2Scores, player1SetsWon: p1SetsWon, player2SetsWon: p2SetsWon };
};

export const generateBracketData = (players: string[]): { main: BracketNode; thirdPlace: BracketNode } => {
  const createNode = (round: number, matchInRound: number, p1: string | null, p2: string | null): BracketNode => {
    let winner: string | null = null;
    let loser: string | null = null;
    let player1Score: number[] | null = null;
    let player2Score: number[] | null = null;
    let player1SetsWon: number | null = null;
    let player2SetsWon: number | null = null;

    if (p1 === BYE && p2 !== BYE) {
      winner = p2;
    } else if (p2 === BYE && p1 !== BYE) {
      winner = p1;
    } else if (p1 && p2) {
      // Simple simulation for demo: player 1 always wins if it's not a BYE
      winner = p1;
      loser = p2;
      const scores = generateScores();
      player1Score = scores.player1Score;
      player2Score = scores.player2Score;
      player1SetsWon = scores.player1SetsWon;
      player2SetsWon = scores.player2SetsWon;
    }
    
    return {
      id: `r${round}-m${matchInRound}`,
      name: `R${round} M${matchInRound}`,
      player1: p1,
      player2: p2,
      winner,
      loser,
      round,
      matchInRound,
      player1Score,
      player2Score,
      player1SetsWon,
      player2SetsWon,
    };
  };
  
  // Round 1 (Round of 32)
  let currentRoundNodes: BracketNode[] = [];
  for (let i = 0; i < 32; i += 2) {
    currentRoundNodes.push(createNode(1, i / 2 + 1, players[i] || null, players[i+1] || null));
  }
  
  let round = 2;
  while(currentRoundNodes.length > 1) {
    const nextRoundNodes: BracketNode[] = [];
    for (let i = 0; i < currentRoundNodes.length; i += 2) {
      const match1 = currentRoundNodes[i];
      const match2 = currentRoundNodes[i+1];
      const newNode = createNode(round, i / 2 + 1, match1.winner, match2.winner);
      newNode.children = [match1, match2];
      nextRoundNodes.push(newNode);
    }
    currentRoundNodes = nextRoundNodes;
    round++;
  }

  const finalNode = currentRoundNodes[0];

  // Third place match
  const semiFinals = finalNode.children;
  if (!semiFinals) throw new Error("Could not find semi-finals");

  const thirdPlaceNode: BracketNode = {
    id: '3rd-place',
    name: '3rd Place Match',
    player1: semiFinals[0].loser,
    player2: semiFinals[1].loser,
    winner: null,
    loser: null,
    round: finalNode.round, 
    matchInRound: 2,
    sourceMatch1Id: semiFinals[0].id,
    sourceMatch2Id: semiFinals[1].id,
    player1Score: null,
    player2Score: null,
    player1SetsWon: null,
    player2SetsWon: null,
  };

  // Simulate winner and scores for 3rd place match
  if (thirdPlaceNode.player1 && thirdPlaceNode.player2) {
    thirdPlaceNode.winner = thirdPlaceNode.player1;
    thirdPlaceNode.loser = thirdPlaceNode.player2;
    const scores = generateScores();
    thirdPlaceNode.player1Score = scores.player1Score;
    thirdPlaceNode.player2Score = scores.player2Score;
    thirdPlaceNode.player1SetsWon = scores.player1SetsWon;
    thirdPlaceNode.player2SetsWon = scores.player2SetsWon;
  }


  return { main: finalNode, thirdPlace: thirdPlaceNode };
};

const findNodeById = (node: BracketNode, id: string): BracketNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

const findParentNode = (root: BracketNode, childId: string): BracketNode | null => {
  if (root.children) {
    if (root.children[0].id === childId || root.children[1].id === childId) {
      return root;
    }
    for (const child of root.children) {
      const parent = findParentNode(child, childId);
      if (parent) return parent;
    }
  }
  return null;
}


export const updateBracketWithWinner = (bracketData: { main: BracketNode; thirdPlace: BracketNode }, matchId: string, winnerName: string): { main: BracketNode; thirdPlace: BracketNode } => {
    const newBracketData = JSON.parse(JSON.stringify(bracketData));
    const { main, thirdPlace } = newBracketData;

    let matchNode = findNodeById(main, matchId);
    if (!matchNode && matchId === thirdPlace.id) {
        matchNode = thirdPlace;
    }

    if (!matchNode || !matchNode.player1 || !matchNode.player2 || matchNode.winner) {
        return bracketData; 
    }

    matchNode.winner = winnerName;
    matchNode.loser = winnerName === matchNode.player1 ? matchNode.player2 : matchNode.player1;

    // Advance winner to next round
    const parentNode = findParentNode(main, matchId);
    if (parentNode) {
      if (parentNode.children && parentNode.children[0].id === matchId) {
        parentNode.player1 = winnerName;
      } else {
        parentNode.player2 = winnerName;
      }
      
      // Check for BYEs in the sibling match
      const siblingMatch = parentNode.children?.find(c => c.id !== matchId);
      if(siblingMatch?.winner) {
        if(parentNode.player1 === null) parentNode.player1 = siblingMatch.winner;
        if(parentNode.player2 === null) parentNode.player2 = siblingMatch.winner;
      }
    }

    // Update 3rd place match
    const semiFinals = findNodeById(main, 'r4-m1')?.children;
    if (semiFinals) {
        const sf1 = findNodeById(main, semiFinals[0].id);
        const sf2 = findNodeById(main, semiFinals[1].id);
        if (sf1?.loser) {
            thirdPlace.player1 = sf1.loser;
        }
        if (sf2?.loser) {
            thirdPlace.player2 = sf2.loser;
        }
    }

    return newBracketData;
};
