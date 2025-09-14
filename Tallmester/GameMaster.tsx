import React, { useState, useEffect } from "react";
import { createGame, listenToPlayers } from "../firestoreService";

export default function GameMaster() {
  const [gameId, setGameId] = useState("");
  const [players, setPlayers] = useState([]);

  const handleCreateGame = async () => {
    const newGame = {
      createdAt: new Date(),
      round: 0,
      status: "waiting",
    };
    const id = await createGame(newGame);
    setGameId(id);
  };

  useEffect(() => {
    if (gameId) {
      const unsubscribe = listenToPlayers(gameId, setPlayers);
      return () => unsubscribe();
    }
  }, [gameId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎮 Tallmester: Game Master</h1>
      {!gameId ? (
        <button onClick={handleCreateGame} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Opprett nytt spill</button>
      ) : (
        <>
          <p className="mb-2">🆔 Spill-ID: <code>{gameId}</code></p>
          <p className="mb-4">🧑‍🤝‍🧑 Spillere:</p>
          <ul className="list-disc list-inside">
            {players.map(p => (
              <li key={p.id}>{p.avatar} {p.name}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
