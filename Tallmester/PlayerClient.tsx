import React, { useEffect, useState } from "react";
import { joinGame, submitAnswer } from "../firestoreService";
import { useSearchParams } from "react-router-dom";

export default function PlayerClient() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧙");
  const [playerId, setPlayerId] = useState("");
  const [input, setInput] = useState("");

  const handleJoin = async () => {
    const playerData = {
      name,
      avatar,
      submission: "",
    };
    const id = await joinGame(gameId, playerData);
    setPlayerId(id);
  };

  const handleSubmit = async () => {
    if (!playerId) return;
    await submitAnswer(gameId, playerId, input);
  };

  if (!gameId) return <p>Ingen gyldig spill-ID i URL.</p>;

  return (
    <div className="p-4">
      {!playerId ? (
        <div>
          <h2 className="text-xl font-bold mb-2">Bli med i spill</h2>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Navn" className="border p-1 mr-2" />
          <select value={avatar} onChange={e => setAvatar(e.target.value)} className="border p-1 mr-2">
            {["🧙", "🤖", "🐉", "👽"].map((a, i) => (
              <option key={i} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={handleJoin} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Bli med</button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-2">Runde pågår</h2>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ditt tall" className="border p-1 mr-2" />
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-xl">Send inn</button>
        </div>
      )}
    </div>
  );
}
