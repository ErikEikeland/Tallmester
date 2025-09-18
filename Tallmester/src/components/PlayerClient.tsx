import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { joinGame, submitAnswer, listenToGame } from "../firestoreService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"; // 🔑 må være riktig import til din konfig

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

  // 🔁 Lytter både til spill-status og spillerens egne data
  useEffect(() => {
    if (!gameId) return;

    // 🔄 Spill-status: rundeteller og tilbakestilling av svar
    const unsubscribeGame = listenToGame(gameId, (gameData) => {
      if (gameData.round !== undefined && gameData.round !== round) {
        setRound(gameData.round);
        setSubmitted(false);
        setAnswer("");
        setError("");
      }
    });

    // 🔄 Lytter på spillerens eget dokument i Firestore
    let unsubscribePlayer: (() => void) | undefined;

    if (playerId) {
      const playerRef = doc(db, "games", gameId, "players", playerId);
      unsubscribePlayer = onSnapshot(playerRef, (docSnap) => {
        const data = docSnap.data();
        if (data) {
          console.log("📲 Oppdaterer spiller fra Firestore:", data);
          setDigits(data.digits || []);
          setScore(data.score ?? 0);
        }
      });
    }

    return () => {
      unsubscribeGame?.();
      unsubscribePlayer?.();
    };
  }, [gameId, playerId, round]);

  async function handleJoin() {
    if (gameId && name && avatar) {
      const id = await joinGame(gameId, name, avatar);
      setPlayerId(id);
    }
  }

  async function handleSubmit() {
    if (!answer) {
      setError("Du må skrive inn et tall.");
      return;
    }

    const value = parseInt(answer);
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

      <p style={{ fontSize: "0.8em", color: "#888" }}>
        🔑 Din ID: {playerId}
      </p>

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

