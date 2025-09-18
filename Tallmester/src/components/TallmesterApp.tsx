import React, { useState, useEffect, useRef } from "react";
import { updateGameStatus, syncPlayers } from "../firestoreService"; // 🆕
import { v4 as uuidv4 } from "uuid";

interface Player {
  id: string;
  name: string;
  avatar: string;
  digits?: number[];
  used?: number[];
  score?: number;
}

interface Answer {
  name: string;
  value: number;
  digits: number[];
  valid: boolean;
}

interface Props {
  playersFromFirebase: Player[];
  answersFromFirebase: Answer[];
  gameId: string;
  gameStatus: string;
}

const canUseDigits = (available: number[] = [], request: number[] = []) => {
  const bag = [...available];
  for (const d of request) {
    const i = bag.indexOf(d);
    if (i === -1) return false;
    bag.splice(i, 1);
  }
  return true;
};

export default function TallmesterApp({
  playersFromFirebase = [],
  answersFromFirebase = [],
  gameId,
  gameStatus,
}: Props) {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [submissions, setSubmissions] = useState<Answer[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [roundPoints, setRoundPoints] = useState<number[]>([]);
  const processedAnswersRef = useRef<Set<string>>(new Set());

  const initialChallenges = [
    { id: 1, title: "Høyeste tall", description: "Lag det høyeste mulige tallet", points: [3, 2, 1, 0] },
    { id: 2, title: "Laveste unike partall", description: "Laveste tall unike partall", points: [4, 2, 1, 0] },
    { id: 3, title: "Nærmest 5000", description: "Lag tallet nærmest 5000", points: [5, 3, 2, 0] },
    { id: 4, title: "Høyeste delelig på 3", description: "Høyest tall som er delelig på 3", points: [4, 2, 1, 0] },
    { id: 5, title: "Størst tresifret", description: "Lag størst mulig tresifret tall", points: [3, 2, 1, 0] },
  ];

  const challenge = initialChallenges[round];

  // ✅ Start spill og synkroniser sifre med Firestore før første runde
  useEffect(() => {
    const startGame = async () => {
      if (
        (playersFromFirebase?.length ?? 0) > 0 &&
        !gameStarted &&
        gameStatus === "started"
      ) {
         console.log("🔁 [TallmesterApp] Forsøker å starte spill...");
          console.log("👥 Spillere fra Firestore:", playersFromFirebase);
        
        const randomDigits = Array.from({ length: 10 }, () =>
          Math.floor(Math.random() * 10)
        );
          console.log("🎲 Genererte sifre:", randomDigits);

       const initializedPlayers = playersFromFirebase.map((p, i) => ({
  id: p.id, // 🔥 behold ekte Firestore-id
  name: p.name || `Spiller ${i + 1}`,
  avatar: p.avatar || "👾",
  digits: [...randomDigits],
  used: [],
  score: 0,
}));

 console.log("📦 Initialiserte spillere:", initializedPlayers);
        setPlayers(initializedPlayers);
        setScores(Array(initializedPlayers.length).fill(0));
        setGameStarted(true);
        setRound(0);

      try {
        await syncPlayers(gameId, initializedPlayers);
        console.log("✅ syncPlayers fullført");
      } catch (err) {
        console.error("❌ syncPlayers feilet:", err);
      }

      try {
        await updateGameStatus(gameId, { round: 0 });
        console.log("✅ updateGameStatus fullført");
      } catch (err) {
        console.error("❌ updateGameStatus feilet:", err);
      }
    }
  };
    startGame();
  }, [playersFromFirebase, gameStarted, gameStatus]);

  // ✅ Valider og håndter innkomne svar
  useEffect(() => {
    const newAnswers = answersFromFirebase.filter(
      (a) => a && !processedAnswersRef.current.has(a.name + a.value)
    );

    if (newAnswers.length === 0) return;

    newAnswers.forEach((a) =>
      processedAnswersRef.current.add(a.name + a.value)
    );

    const roundSubs = newAnswers.map((a) => {
      const player = players.find((p) => p.name === a.name);
      const hasDigits = canUseDigits(player?.digits || [], a.digits || []);

      const isPartall = a.value % 2 === 0;
      const isDelelig3 = a.value % 3 === 0;
      const isTresifret = a.value >= 100 && a.value <= 999;

      const valid =
        hasDigits &&
        a.valid &&
        (challenge.id !== 2 || isPartall) &&
        (challenge.id !== 4 || isDelelig3) &&
        (challenge.id !== 5 || isTresifret);

      return {
        name: a.name,
        value: a.value,
        digits: a.digits,
        valid,
      };
    });

    const allSubs = [...submissions, ...roundSubs];
    setSubmissions(allSubs);

    let validSubs = allSubs.filter((s) => s.valid);

    if (challenge.id === 2) {
      const valueCounts = validSubs.reduce((acc, cur) => {
        acc[cur.value] = (acc[cur.value] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      validSubs = validSubs.filter((s) => valueCounts[s.value] === 1);
    }

    let ranked;
    if (challenge.title.toLowerCase().includes("laveste")) {
      ranked = [...validSubs].sort((a, b) => a.value - b.value);
    } else if (challenge.title.toLowerCase().includes("nærmest")) {
      ranked = [...validSubs].sort(
        (a, b) => Math.abs(5000 - a.value) - Math.abs(5000 - b.value)
      );
    } else {
      ranked = [...validSubs].sort((a, b) => b.value - a.value);
    }

    const updatedScores = [...scores];
    const pointsThisRound = Array(players.length).fill(0);

    let place = 0;
    let lastValue = null;
    let sameRankCount = 0;

    ranked.forEach((s) => {
      if (s.value !== lastValue) {
        place += sameRankCount;
        sameRankCount = 1;
        lastValue = s.value;
      } else {
        sameRankCount++;
      }
      const playerIndex = players.findIndex((p) => p.name === s.name);
      const point = challenge.points[place] || 0;
      updatedScores[playerIndex] = (updatedScores[playerIndex] ?? 0) + point;
      pointsThisRound[playerIndex] = point;
    });

    setScores(updatedScores);
    setRoundPoints(pointsThisRound);
  }, [answersFromFirebase]);

  // ⏭️ Neste runde: fjern brukte sifre og oppdater Firestore
  const nextRound = async () => {
    const updatedPlayers = players.map((p) => {
      const submission = submissions.find((s) => s.name === p.name);
      if (submission && submission.valid) {
        const inputDigitCount = submission.digits.reduce((acc, d) => {
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const newDigits = [...p.digits];
        for (const [digitStr, count] of Object.entries(inputDigitCount)) {
          let remaining = count;
          for (let i = 0; i < newDigits.length && remaining > 0; i++) {
            if (newDigits[i] === Number(digitStr)) {
              newDigits.splice(i, 1);
              i--;
              remaining--;
            }
          }
        }

        return {
          ...p,
          used: [...p.used, ...submission.digits],
          digits: newDigits,
        };
      }
      return { ...p };
    });

    setPlayers(updatedPlayers);
    await syncPlayers(gameId, updatedPlayers); // 🆕 Synk etter runde

    setSubmissions([]);
    setRound((prev) => {
      const newRound = prev + 1;
      updateGameStatus(gameId, { round: newRound });
      return newRound;
    });
    setRoundPoints([]);
    processedAnswersRef.current.clear();
  };

  const gameEnded = round >= initialChallenges.length;

  if (!gameStarted) return <div>Venter på spillere ...</div>;

  if (gameEnded) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Spillet er ferdig!</h2>
        <h3 className="font-semibold mb-2">Sluttresultat:</h3>
        <ul className="mb-4">
          {players.map((p, i) => (
            <li key={i}>
              {p.avatar} {p.name}: {scores[i]} poeng
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-1">Runde {round + 1}:</h2>
      <p className="mb-2 italic">
        {challenge.title} – {challenge.description}
      </p>

      <div className="mb-4 p-2 border border-dashed rounded">
        <h3 className="font-semibold mb-1">📋 Rundeliste:</h3>
        <ol className="list-decimal list-inside">
          {initialChallenges.map((ch, idx) => (
            <li
              key={ch.id}
              className={
                idx === round
                  ? "font-bold text-blue-700"
                  : idx < round
                  ? "text-gray-500"
                  : ""
              }
            >
              Runde {idx + 1}: {ch.title}
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">🔢 Spilleroversikt:</h3>
        {players.map((p, i) => {
          const hasAnswered = submissions.some((s) => s.name === p.name);
          return (
            <div key={i} className="mb-2 p-2 border rounded">
              <div className="font-semibold">
                {p.avatar} {p.name} {hasAnswered && "✅"}
              </div>
              <div className="text-sm">
                Tilgjengelige sifre: {p.digits?.join(", ")}
              </div>
            </div>
          );
        })}
      </div>

      {roundPoints.length > 0 && submissions.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">📨 Svar fra spillerne:</h3>
          <ul>
            {submissions.map((s, i) => (
              <li key={i}>
                {s.name}: {s.value} {s.valid ? "✅" : "❌"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={nextRound}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl"
      >
        Neste runde
      </button>

      {roundPoints.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Poeng denne runden:</h3>
          <ul>
            {players.map((p, i) => (
              <li key={i}>
                {p.name}: {roundPoints[i]} poeng (Total: {scores[i]})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


