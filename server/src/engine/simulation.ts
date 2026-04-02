export interface PlayerStats {
  position: string; // GR, DEF, MED, ATA
  quality: number;
  aggressiveness: number;
  craque: boolean;
}

export interface TeamStats {
  players: PlayerStats[];
  clubId?: number;
  formation: string;
  style: string; // DEFENSIVO, EQUILIBRADO, OFENSIVO
  moral: number;
  isHome: boolean;
}

const FORMATION_ATT_FACTOR: Record<string, number> = {
  "4-2-4": 1.15,
  "3-4-3": 1.12,
  "4-3-3": 1.08,
  "4-4-2": 1.00,
  "4-5-1": 0.90,
  "5-3-2": 0.85,
  "5-4-1": 0.80
};

const FORMATION_DEF_FACTOR: Record<string, number> = {
  "5-4-1": 1.25,
  "5-3-2": 1.20,
  "4-5-1": 1.10,
  "4-4-2": 1.00,
  "3-5-2": 0.95,
  "4-3-3": 0.90,
  "3-4-3": 0.85,
  "4-2-4": 0.75
};

const STYLE_ATT_FACTOR: Record<string, number> = {
  "DEFENSIVO": 0.85,
  "EQUILIBRADO": 1.00,
  "OFENSIVO": 1.15
};

function getAvg(players: PlayerStats[], pos: string) {
  const filtered = players.filter(p => p.position === pos);
  if (filtered.length === 0) return 1;
  const sum = filtered.reduce((acc, p) => acc + p.quality, 0);
  return sum / filtered.length;
}

function calculateOffensivePower(team: TeamStats, opponentStyle: string) {
  const avgMed = getAvg(team.players, 'MED');
  const avgAta = getAvg(team.players, 'ATA');
  
  let pwr = (avgMed * 0.4) + (avgAta * 0.6);
  pwr *= FORMATION_ATT_FACTOR[team.formation] || 1.0;
  
  const bonusMoral = (team.moral - 50) * 0.005;
  pwr *= (1 + bonusMoral);

  pwr *= STYLE_ATT_FACTOR[team.style] || 1.0;
  pwr *= (1 / (STYLE_ATT_FACTOR[opponentStyle] || 1.0)); // penalty if opp defensive
  
  return pwr;
}

function calculateDefensivePower(team: TeamStats) {
  const avgDef = getAvg(team.players, 'DEF');
  const avgGr = getAvg(team.players, 'GR');
  
  let pwr = (avgDef * 0.6) + (avgGr * 0.4);
  pwr *= FORMATION_DEF_FACTOR[team.formation] || 1.0;
  
  return pwr;
}

export function simulateHalfTime(
  teamA: TeamStats,
  teamB: TeamStats,
  refereeInclination: number, // positive pushes Team A, negative Team B
  minutes: number = 45
) {
  const offA = calculateOffensivePower(teamA, teamB.style);
  const defA = calculateDefensivePower(teamA);
  
  const offB = calculateOffensivePower(teamB, teamA.style);
  const defB = calculateDefensivePower(teamB);
  
  const events = [];
  let scoreA = 0;
  let scoreB = 0;

  let probMinuteA = (offA / (offA + defB * 2)) * 0.02;
  if(teamA.isHome) probMinuteA *= 1.05; else probMinuteA *= 0.95;
  
  let probMinuteB = (offB / (offB + defA * 2)) * 0.02;
  if(teamB.isHome) probMinuteB *= 1.05; else probMinuteB *= 0.95;

  const getAggressivenessAvg = (team: TeamStats) => {
    return team.players.reduce((sum, p) => sum + p.aggressiveness, 0) / team.players.length;
  };

  const probYellowBase = 0.02;
  const probYellowA = probYellowBase * (1 + (getAggressivenessAvg(teamA) - 3) * 0.1) * (1 - (refereeInclination * 0.15));
  const probYellowB = probYellowBase * (1 + (getAggressivenessAvg(teamB) - 3) * 0.1) * (1 + (refereeInclination * 0.15));

  for (let m = 1; m <= minutes; m++) {
    // Check goal Team A
    if (Math.random() < probMinuteA) {
      const craques = teamA.players.filter(p => p.craque).length;
      let isDecisive = false;
      if (craques > 0 && Math.random() < (0.2 * craques)) {
        isDecisive = true;
      }
      events.push({ minute: m, team: 'A', type: 'GOAL', decisive: isDecisive });
      scoreA++;
    }

    // Check goal Team B
    if (Math.random() < probMinuteB) {
      const craques = teamB.players.filter(p => p.craque).length;
      let isDecisive = false;
      if (craques > 0 && Math.random() < (0.2 * craques)) {
        isDecisive = true;
      }
      events.push({ minute: m, team: 'B', type: 'GOAL', decisive: isDecisive });
      scoreB++;
    }

    // Checking cards A
    if (Math.random() < probYellowA) {
      const isRed = Math.random() < 0.15;
      events.push({ minute: m, team: 'A', type: isRed ? 'RED_CARD' : 'YELLOW_CARD' });
    }

    // Checking cards B
    if (Math.random() < probYellowB) {
      const isRed = Math.random() < 0.15;
      events.push({ minute: m, team: 'B', type: isRed ? 'RED_CARD' : 'YELLOW_CARD' });
    }
  }

  return { scoreA, scoreB, events };
}
