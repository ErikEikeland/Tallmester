import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importerer hovedkomponentene for de tre ulike rollene i spillet
import TallmesterApp from "./components/TallmesterApp"; // Lokal enkelversjon av spillet
import GameMaster from "./components/GameMaster"; // Lærervisning, styrer spillet og viser QR-kode
import PlayerClient from "./components/PlayerClient"; // Spillerklient for mobil, der elever leverer svar

export default function App() {
  return (
    // Oppretter en Router for navigasjon mellom ulike ruter/visninger
    <Router>
      <Routes>
        {/* Rute for lokal spilling uten flerspiller. */}
        <Route path="/" element={<TallmesterApp />} />

        {/* Rute for lærerens skjerm der spillet styres. Viser spill-ID og QR-kode */}
        <Route path="/game" element={<GameMaster />} />

        {/* Rute for spillerens mobilvisning. gameId må være med i URL-en som query-param */}
        <Route path="/join" element={<PlayerClient />} />
      </Routes>
    </Router>
  );
}
