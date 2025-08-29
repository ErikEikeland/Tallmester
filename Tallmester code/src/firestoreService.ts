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

// ✅ Legger til en ny spiller i et spill
export async function joinGame(
  gameId: string,
  playerName: string,
  avatar: string
) {
  const playersRef = collection(db, "games", gameId, "players");
  const docRef = await addDoc(playersRef, {
    name: playerName,
    avatar,
    currentAnswer: "",
    score: 0,
    hasSubmitted: false,
  });
  return docRef.id;
}

// ✅ Oppdaterer spillerens svar (brukes av mobilenheter)
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

// ✅ Lytter på spillinfo (for f.eks. status)
export function listenToGame(
  gameId: string,
  callback: (gameData: any) => void
) {
  return onSnapshot(doc(db, "games", gameId), (doc) => {
    callback(doc.data());
  });
}

// ✅ Endrer spillstatus ("waiting", "started", etc.)
export async function updateGameStatus(
  gameId: string,
  updates: Record<string, any>
) {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, updates);
}

// ✅ Lytter på spillere
export function listenToPlayers(
  gameId: string,
  callback: (players: any[]) => void
) {
  const q = collection(db, "games", gameId, "players");
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(players);
  });
}

// ✅ Lytter på svar fra spillere (alias for listenToPlayers, men filtrerer ut svar)
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
