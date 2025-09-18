import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// ✅ Oppretter nytt spill og returnerer gameId
export async function createGame(gameConfig: any) {
  const docRef = await addDoc(collection(db, "games"), {
    ...gameConfig,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ✅ Legger til en ny spiller i et spill – med tomme digits som fylles inn senere
export async function joinGame(
  gameId: string,
  playerName: string,
  avatar: string
) {
  const playersRef = collection(db, "games", gameId, "players");
  const docRef = await addDoc(playersRef, {
    name: playerName,
    avatar,
    digits: [],
    used: [],
    currentAnswer: null,
    score: 0,
    hasSubmitted: false,
  });
  return docRef.id;
}

// ✅ Spilleren sender inn svaret sitt (fra mobilklient)
export async function submitAnswer(
  gameId: string,
  playerId: string,
  answer: {
    value: number;
    digits: number[];
    valid: boolean;
  }
) {
  const playerRef = doc(db, "games", gameId, "players", playerId);
  await updateDoc(playerRef, {
    currentAnswer: answer,
    hasSubmitted: true,
  });
}

// ✅ Lytter på selve game-dokumentet (status, runde osv.)
export function listenToGame(
  gameId: string,
  callback: (gameData: any) => void
) {
  return onSnapshot(doc(db, "games", gameId), (doc) => {
    callback(doc.data());
  });
}

// ✅ Oppdaterer spillstatus (runde, challenge osv.)
export async function updateGameStatus(
  gameId: string,
  updates: Record<string, any>
) {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    ...updates,
    currentChallenge: {
      digits: [1, 2, 3, 4], // Du kan gjøre dette dynamisk senere
      limit: 30,
    },
    startedAt: serverTimestamp(),
  });
}

// ✅ Lytter på spiller-listen
export function listenToPlayers(
  gameId: string,
  callback: (players: any[]) => void
) {
  const q = collection(db, "games", gameId, "players");
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(players);
  });
}

// ✅ Lytter på bare svar fra spillerne (filterer ut currentAnswer)
export function listenToAnswers(
  gameId: string,
  callback: (answers: any[]) => void
) {
  const q = collection(db, "games", gameId, "players");
  return onSnapshot(q, (snapshot) => {
    const answers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name,
        value: data.currentAnswer?.value ?? 0,
        digits: data.currentAnswer?.digits ?? [],
        valid: data.currentAnswer?.valid ?? false,
      };
    });
    callback(answers);
  });
}

// 🆕 Synkroniserer oppdaterte sifre, score og brukte siffer etter hver runde
export async function syncPlayers(gameId: string, players: any[]) {
  const updates = players.map(async (player) => {
    const ref = doc(db, "games", gameId, "players", player.id);
    return updateDoc(ref, {
      digits: player.digits || [],
      used: player.used || [],
      score: player.score ?? 0,
    });
  });
  await Promise.all(updates);
}

// ✅ NY: Lytter på én spesifikk spiller
export function listenToPlayer(
  gameId: string,
  playerId: string,
  callback: (player: any | null) => void
) {
  const ref = doc(db, "games", gameId, "players", playerId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      console.warn("⚠️ Player document does not exist:", { gameId, playerId });
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() });
  });
}
