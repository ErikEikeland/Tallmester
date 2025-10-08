import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  joinGame,
  submitAnswer,
  listenToGame,
  listenToPlayer,
  getPlayerData,
} from "../firestoreService";

export default function PlayerClient() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🎩");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [round, setRound] = useState<number | null>(null);
  const [digits, setDigits] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [error, setError] = useState("");

  const canUseDigits = (available: number[], request: number[]) => {
    const bag = [...available];
    for (const d of request) {
      const i = bag.indexOf(d);
      if (i === -1) return false;
      bag.splice(i, 1);
    }
    return true;
  };

  // 🔁 Gjenopprett playerId ved refresh
  useEffect(() => {
    if (!gameId || playerId) return;
    const saved = localStorage.getItem(`tm:${gameId}:playerId`);
    if (saved) setPlayerId(saved);
  }, [gameId, playerId]);

  // 🔁 Lytt til rundeendring
  useEffect(() => {
    if (!gameId) return;
    const unsubGame = listenToGame(gameId, (gameData) => {
      if (gameData?.round !== undefined && gameData.round !== round) {
        setRound(gameData.round);
        setSubmitted(false);
        setAnswer("");
        setError("");
      }
    });
    return () => unsubGame?.();
  }, [gameId, round]);

  // ✅ Lytt til egen spiller når playerId er tilgjengelig
  useEffect(() => {
    if (!gameId || !playerId) return;
    const unsub = listenToPlayer(gameId, playerId, (me) => {
      if (me) {
        setDigits(me.digits || []);
        setScore(me.score ?? 0);
      }
    });
    return () => unsub?.();
  }, [gameId, playerId]);

  // 🔁 Manuell fallback: hent spillerdata direkte fra Firestore (ikke vist i UI)
  async function hentPåNytt() {
    if (!gameId || !playerId) return;
    const data = await getPlayerData(gameId, playerId);
    if (data) {
      setDigits(data.digits || []);
      setScore(data.score ?? 0);
    } else {
      setError("Fant ikke spillerdata ved manuell henting.");
    }
  }

  async function handleJoin() {
    if (gameId && name.trim() && avatar) {
      const id = await joinGame(gameId, name.trim(), avatar);
      setPlayerId(id);
      localStorage.setItem(`tm:${gameId}:playerId`, id);
    } else {
      setError("Skriv inn navn og velg avatar.");
    }
  }

  async function handleSubmit() {
    if (!answer) {
      setError("Du må skrive inn et tall.");
      return;
    }

    const value = parseInt(answer, 10);
    const answerDigits = answer.split("").map(Number);
    const valid =
      !isNaN(value) &&
      answerDigits.every((d) => d >= 0 && d <= 9) &&
      canUseDigits(digits, answerDigits);

    if (!valid) {
      setError("Ugyldig svar – sjekk at du bruker riktige sifre.");
      return;
    }

    if (gameId && playerId) {
      const answerObj = { value, digits: answerDigits, valid };
      await submitAnswer(gameId, playerId, answerObj);
      setSubmitted(true);
      setError("");
    }
  }

  if (!gameId) return <p>❌ Mangler gameId i URL-en.</p>;

  if (!playerId) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>🧑‍🎓 Bli med i Tallmester</h2>
        <input
          placeholder="Navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
          <option value="🎩">🎩</option>
          <option value="🧙‍♂️">🧙‍♂️</option>
          <option value="🧛‍♀️">🧛‍♀️</option>
          <option value="🤖">🤖</option>
          <option value="👻">👻</option>
          <option value="🐉">🐉</option>
        </select>
        <br />
        <button onClick={handleJoin}>Bli med</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>
        {avatar} {name}
      </h2>

      {round !== null && <p>🔁 Runde {round + 1}</p>}
      <p>🎯 Poeng: {score}</p>
      <p>
        🔢 Tilgjengelige sifre:{" "}
        {digits.length > 0
          ? digits.join(", ")
          : "Venter på tildeling fra lærer..."}
      </p>

      <p style={{ fontSize: "0.8em", color: "#888" }}>🔑 Din ID: {playerId}</p>

      {submitted ? (
        <p>✅ Svaret ditt er sendt inn!</p>
      ) : (
        <>
          <input
            placeholder="Svar"
            value={answer}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "");
              setAnswer(clean);
            }}
          />
          <button onClick={handleSubmit}>Send inn</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
}





