import React, { useEffect, useState } from "react";
import TallmesterApp from "./TallmesterApp";
import {
  createGame,
  listenToPlayers,
  listenToAnswers,
  submitAnswer,
  listenToGame,
  updateGameStatus,
} from "../firestoreService";
import { QRCodeCanvas } from "qrcode.react";

export default function GameMaster() {
  const [players, setPlayers] = useState<any[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState("waiting");

  // Oppretter nytt spill og starter lytting
  useEffect(() => {
    const startNewGame = async () => {
      const id = await createGame({ status: "waiting" });
      setGameId(id);

      listenToPlayers(id, (firebasePlayers) => {
        setPlayers(firebasePlayers);
      });

      listenToAnswers(id, (newAnswers) => {
        setAnswers(newAnswers);
      });
    };

    startNewGame();
  }, []);

  // Lytt til statusendringer i spillet
  useEffect(() => {
    if (!gameId) return;
    const unsub = listenToGame(gameId, (gameData) => {
      setGameStatus(gameData.status ?? "waiting");
    });
    return () => unsub?.();
  }, [gameId]);

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="text-2xl font-bold mb-2">🎩 Tallmester – Lærervisning</h1>

      {gameId && (
        <div className="mb-4">
          <p>
            <strong>Game ID:</strong> {gameId}
          </p>
          <p>Spillere kan bli med via QR-koden:</p>
          <QRCodeCanvas
            value={`${window.location.origin}/join?gameId=${gameId}`}
            size={200}
          />
        </div>
      )}

      {gameStatus === "waiting" && (
        <button
          onClick={() => updateGameStatus(gameId!, { status: "started" })}
          className="px-4 py-2 bg-green-600 text-white rounded-xl mt-2"
        >
          🚀 Start spillet
        </button>
      )}

      <div className="mb-4">
        <h2 className="font-semibold">👥 Spillere som har koblet til:</h2>
        {players.length > 0 ? (
          <ul>
            {players.map((p, i) => (
              <li key={i}>
                {p.avatar} {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>⏳ Ingen spillere har koblet til ennå.</p>
        )}
      </div>

      {gameStatus === "started" && (
        <>
          <p className="mb-2">📨 {answers.length} svar registrert så langt</p>
          {players.length > 0 ? (
            <TallmesterApp
              gameId={gameId!}
              playersFromFirebase={players}
              answersFromFirebase={answers}
              gameStatus={gameStatus}
            />
          ) : (
            <p>🔒 Venter på minst én spiller før runden starter.</p>
          )}
        </>
      )}
    </div>
  );
}
