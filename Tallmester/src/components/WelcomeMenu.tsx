import React from "react";
import { useNavigate } from "react-router-dom";

export default function WelcomeMenu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-yellow-100 to-blue-200">
      <h1 className="text-4xl font-extrabold mb-6">🎩 Velkommen til Tallmester</h1>
      <p className="mb-8 text-lg text-gray-700 max-w-xl text-center">
        Tallmester er et flerspiller matematikaspill for klasserommet. Velg rolle for å komme i gang:
      </p>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => navigate("/game")}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow"
        >
          🧑‍🏫 Lærer (Spillmester)
        </button>
        <button
          onClick={() => navigate("/join")}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow"
        >
          📱 Elev (Spiller)
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow"
        >
          🎮 Lokal testvisning
        </button>
      </div>
    </div>
  );
}
