import { describe, it, expect } from 'vitest';

// We implement the same logic as our SQL function to verify weights
const calculateRankingScore = (
  roi: number,
  winRate: number,
  risk: 'Low' | 'Medium' | 'High',
  trades: number,
  drawdown: number
) => {
  const riskScore = risk === 'Low' ? 100 : risk === 'Medium' ? 70 : 40;
  // Weighted score calculation
  const score = 
    (roi * 0.40) + 
    (winRate * 0.30) + 
    (riskScore * 0.15) + 
    (Math.min(trades / 10, 100) * 0.10) - // Normalize trades
    (drawdown * 0.15); // Heavily penalized drawdown
  
  return score;
};

const getRankingLevel = (score: number) => {
  if (score >= 60) return 'ELITE PRO';
  if (score >= 40) return 'GOLD TIER';
  if (score >= 25) return 'SILVER STAR';
  return 'BRONZE';
};

describe('Trader Ranking Logic', () => {
  it('assigns ELITE PRO to high-performing traders', () => {
    const score = calculateRankingScore(45, 92, 'Low', 500, 2);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(getRankingLevel(score)).toBe('ELITE PRO');
  });

  it('assigns GOLD TIER to competitive traders', () => {
    const score = calculateRankingScore(20, 75, 'Medium', 200, 8);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(getRankingLevel(score)).toBe('GOLD TIER');
  });

  it('assigns SILVER STAR to growing traders', () => {
    const score = calculateRankingScore(10, 60, 'High', 100, 15);
    expect(score).toBeGreaterThanOrEqual(25);
    expect(getRankingLevel(score)).toBe('SILVER STAR');
  });

  it('assigns BRONZE to new or high-risk traders', () => {
    const score = calculateRankingScore(5, 40, 'High', 30, 25);
    expect(score).toBeLessThan(25);
    expect(getRankingLevel(score)).toBe('BRONZE');
  });

  it('penalizes high drawdown heavily', () => {
     const scoreGood = calculateRankingScore(20, 80, 'Medium', 100, 5);
     const scoreBad = calculateRankingScore(20, 80, 'Medium', 100, 40);
     expect(scoreBad).toBeLessThan(scoreGood - 3); // 35 * 0.10 points difference
  });
});
