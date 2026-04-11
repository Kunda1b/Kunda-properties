import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import EscrowOversight from "./pages/EscrowOversight";
import KYCQueue from "./pages/KYCQueue";
import ListingModeration from "./pages/ListingModeration";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="kyc" element={<KYCQueue />} />
          <Route path="listings" element={<ListingModeration />} />
          <Route path="escrow" element={<EscrowOversight />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
