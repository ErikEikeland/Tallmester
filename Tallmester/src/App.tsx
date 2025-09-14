import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importerer hovedkomponentene for de tre ulike rollene i spillet
import TallmesterApp from "./components/TallmesterApp"; // Lokal enkelversjon av spillet
import GameMaster from "./components/GameMaster"; // Lærervisning, styrer spillet og viser QR-kode
import PlayerClient from "./components/PlayerClient"; // Spillerklient for mobil, der elever leverer svar
import WelcomeMenu from "./components/WelcomeMenu";

export default function App() {
  return (
    // Oppretter en Router for navigasjon mellom ulike ruter/visninger
    <Router>
      <Routes>
         <Route path="/" element={<WelcomeMenu />} />
        <Route path="/local" element={<TallmesterApp />} />
      </Routes>
    </Router>
  );
}
