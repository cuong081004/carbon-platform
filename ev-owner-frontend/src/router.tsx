import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import WalletPage from "./pages/wallet";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>
    </BrowserRouter>
  );
}
