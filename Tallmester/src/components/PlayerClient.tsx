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

  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = listenToGame(gameId, (gameData) => {
      console.log("Ny gamedata:", gameData); // ← LEGG DEN INN HER

      if (gameData.round !== undefined && gameData.round !== round) {
        setRound(gameData.round);
        setSubmitted(false); // Tillat nytt svar i ny runde
        setAnswer(""); // Tilbakestill input-felt
      }
    });
    return () => unsubscribe?.();
  }, [gameId, round]);

  async function handleJoin() {
    if (gameId && name && avatar) {
      const id = await joinGame(gameId, name, avatar);
      setPlayerId(id);
    }
  }

  async function handleSubmit() {
    if (gameId && playerId && answer) {
      const value = parseInt(answer);
      const digits = answer.split("").map(Number);
      const valid = !isNaN(value) && digits.every((d) => d >= 0 && d <= 9);
      const answerObj = { value, digits, valid };
      await submitAnswer(gameId, playerId, answerObj);
      setSubmitted(true);
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
      {submitted ? (
        <p>✅ Svaret ditt er sendt inn!</p>
      ) : (
        <>
          <input
            placeholder="Svar"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button onClick={handleSubmit}>Send inn</button>
        </>
      )}
    </div>
  );
}
