import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importerer hovedkomponentene for de ulike rollene
import TallmesterApp from "./components/TallmesterApp";
import GameMaster from "./components/GameMaster";
import PlayerClient from "./components/PlayerClient";
import WelcomeMenu from "./components/WelcomeMenu";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Startside med menyvalg */}
        <Route path="/" element={<WelcomeMenu />} />

        {/* Lokal testvisning (uten nett, QR-kode eller database) */}
        <Route path="/local" element={<TallmesterApp />} />

        {/* Lærerens spillvisning */}
        <Route path="/game" element={<GameMaster />} />

        {/* Elevenes mobilvisning (kobles til via gameId i URL) */}
        <Route path="/join" element={<PlayerClient />} />
      </Routes>
    </Router>
  );
}
