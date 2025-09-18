import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { joinGame, submitAnswer, listenToGame } from "../firestoreService";

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
  const [score, setScore] = useState<number>(0); // 🆕 Nytt state
  const [error, setError] = useState("");

  // 🔁 Lokal validering: har spilleren sifrene de prøver å bruke?
  const canUseDigits = (available: number[], request: number[]) => {
    const bag = [...available];
    for (const d of request) {
      const i = bag.indexOf(d);
      if (i === -1) return false;
      bag.splice(i, 1);
    }
    return true;
  };

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = listenToGame(gameId, (gameData) => {
      if (gameData.round !== undefined && gameData.round !== round) {
        setRound(gameData.round);
        setSubmitted(false);
        setAnswer("");
        setError("");
      }

      // 🔍 Finn spilleren og oppdater lokale data
      if (playerId && gameData.players) {
        const me = gameData.players.find((p: any) => p.id === playerId);
        if (me) {
          setDigits(me.digits || []);
          setScore(me.score ?? 0);
        }
      }
    });

    return () => unsubscribe?.();
  }, [gameId, round, playerId]);

  async function handleJoin() {
    if (gameId && name && avatar) {
      const id = await joinGame(gameId, name, avatar);
      setPlayerId(id);
    }
  }

  async function handleSubmit() {
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
        {digits.length > 0 ? digits.join(", ") : "Ingen"}
      </p>

      {submitted ? (
        <p>✅ Svaret ditt er sendt inn!</p>
      ) : (
        <>
          <input
            placeholder="Svar"
            value={answer}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, ""); // Kun tall
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
