// src/model/challenges.ts
export type Challenge = {
  id: number;
  title: string;
  description: string;
  points: number[];
};

export const CHALLENGES: Challenge[] = [
  { id: 1, title: "Høyeste tall",            description: "Lag det høyeste mulige tallet",   points: [3, 2, 1, 0] },
  { id: 2, title: "Laveste unike partall",    description: "Laveste tall som er unikt og partall", points: [4, 2, 1, 0] },
  { id: 3, title: "Nærmest 5000",             description: "Lag tallet nærmest 5000",        points: [5, 3, 2, 0] },
  { id: 4, title: "Høyeste delelig på 3",     description: "Høyest tall som er delelig på 3", points: [4, 2, 1, 0] },
  { id: 5, title: "Størst tresifret",         description: "Lag størst mulig tresifret tall", points: [3, 2, 1, 0] },
];

export function getChallenge(roundIndex: number | null | undefined): Challenge | null {
  if (roundIndex == null) return null;
  if (roundIndex < 0 || roundIndex >= CHALLENGES.length) return null;
  return CHALLENGES[roundIndex];
}

// Små hjelpefunksjoner til UI/validering i klient
export function requiresEven(id: number)       { return id === 2; }
export function requiresDivBy3(id: number)     { return id === 4; }
export function requiresThreeDigits(id: number){ return id === 5; }

export function ruleBadges(id: number): string[] {
  const badges: string[] = [];
  if (requiresEven(id)) badges.push("partall");
  if (requiresDivBy3(id)) badges.push("delelig på 3");
  if (requiresThreeDigits(id)) badges.push("tresifret");
  return badges;
}
