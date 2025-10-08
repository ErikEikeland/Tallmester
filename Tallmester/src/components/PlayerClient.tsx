import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  joinGame,
  submitAnswer,
  listenToGame,
  listenToPlayer,
  getPlayerData,
} from "../firestoreService";
import {
  getChallenge,
  ruleBadges,
  requiresEven,
  requiresDivBy3,
  requiresThreeDigits,
} from "../model/challenges";

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

  const challenge = useMemo(() => getChallenge(round), [round]);
  const badges = useMemo(() => (challenge ? ruleBadges(challenge.id) : []), [challenge]);

  const canUseDigits = (available: number[], request: number[]) => {
    const bag = [...available];
    for (const d of request) {
      const i = bag.indexOf(d);
      if (i === -1) return false;
      bag.splice(i, 1);
    }
    return true;
  };

  // Gjenopprett playerId ved refresh
  useEffect(() => {
    if (!gameId || playerId) return;
    const saved = localStorage.getItem(`tm:${gameId}:playerId`);
    if (saved) setPlayerId(saved);
  }, [gameId, playerId]);

  // Lytt til rundeendring
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

  // Lytt til egen spiller når playerId er tilgjengelig
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

  // Manuell fallback (ikke vist i UI)
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

  // Klientside-sjekk i tråd med reglene brukt i TallmesterApp
  function passesChallengeRules(value: number) {
    if (!challenge) return true;
    if (requiresEven(challenge.id) && value % 2 !== 0) return false;
    if (requiresDivBy3(challenge.id) && value % 3 !== 0) return false;
    if (requiresThreeDigits(challenge.id) && (value < 100 || value > 999)) return false;
    return true;
  }

  async function handleSubmit() {
    if (!answer) {
      setError("Du må skrive inn et tall.");
      return;
    }

    const value = parseInt(answer, 10);
    const answerDigits = answer.split("").map(Number);

    if (isNaN(value)) {
      setError("Skriv inn et gyldig tall.");
      return;
    }

    if (!passesChallengeRules(value)) {
      // Gi konkrete, vennlige feilmeldinger
      if (challenge) {
        if (requiresEven(challenge.id)) {
          setError("Oppgaven krever et partall.");
          return;
        }
        if (requiresDivBy3(challenge.id)) {
          setError("Oppgaven krever et tall som er delelig på 3.");
          return;
        }
        if (requiresThreeDigits(challenge.id)) {
          setError("Oppgaven krever et tresifret tall (100–999).");
          return;
        }
      }
      setError("Svaret møter ikke oppgavekravene.");
      return;
    }

    const validDigits =
      answerDigits.every((d) => d >= 0 && d <= 9) && canUseDigits(digits, answerDigits);

    if (!validDigits) {
      setError("Ugyldig svar – sjekk at du bruker riktige sifre.");
      return;
    }

    if (gameId && playerId) {
      const answerObj = { value, digits: answerDigits, valid: true };
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
    <div style={{ padding: "1rem", display: "grid", gap: "0.75rem" }}>
      <h2 style={{ marginBottom: 0 }}>
        {avatar} {name}
      </h2>

      {/* Oppgavekortet for runden */}
      {challenge ? (
        <div style={{ border: "1px dashed #bbb", borderRadius: 12, padding: "0.75rem" }}>
          <div style={{ fontWeight: 700 }}>
            Runde {round! + 1}: {challenge.title}
          </div>
          <div style={{ fontStyle: "italic", marginTop: 4 }}>{challenge.description}</div>
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {badges.map((b) => (
                <span
                  key={b}
                  style={{
                    fontSize: "0.8rem",
                    border: "1px solid #ddd",
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>Venter på rundedata …</p>
      )}

      <div>🎯 Poeng: {score}</div>

      <div>
        🔢 Tilgjengelige sifre:{" "}
        {digits.length > 0 ? digits.join(", ") : "Venter på tildeling fra lærer..."}
      </div>

      <p style={{ fontSize: "0.8em", color: "#888", marginTop: 0 }}>
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
              if (error) setError("");
            }}
          />
          <button onClick={handleSubmit} disabled={!answer}>
            Send inn
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
}






