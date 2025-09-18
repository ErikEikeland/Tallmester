import { collection, doc, setDoc, getDoc, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const createGame = async (gameData) => {
  const gameRef = await addDoc(collection(db, "games"), gameData);
  return gameRef.id;
};

export const joinGame = async (gameId, playerData) => {
  const playerRef = doc(collection(db, "games", gameId, "players"));
  await setDoc(playerRef, playerData);
  return playerRef.id;
};

export async function getPlayerData(gameId: string, playerId: string) {
  const ref = doc(db, "games", gameId, "players", playerId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export const submitAnswer = async (gameId, playerId, submission) => {
  const playerRef = doc(db, "games", gameId, "players", playerId);
  await updateDoc(playerRef, { submission });
};

export const listenToGame = (gameId, callback) => {
  const gameRef = doc(db, "games", gameId);
  return onSnapshot(gameRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
};

export const listenToPlayers = (gameId, callback) => {
  const playersRef = collection(db, "games", gameId, "players");
  return onSnapshot(playersRef, (snapshot) => {
    const players = [];
    snapshot.forEach((doc) => players.push({ id: doc.id, ...doc.data() }));
    callback(players);
  });
};
