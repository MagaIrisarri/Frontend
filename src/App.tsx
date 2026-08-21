import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import "./App.css";
import Register from "./pages/Register";
import Home from "./pages/Home";
import VehicleManagement from "./pages/Vehicle/VehicleManagement";
import CreateVehiclePage from "./pages/Vehicle/CreateVehicle";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="page">
              <div className="card">
                <h1>Bienvenido al Sistema</h1>
                <p className="subtitle">
                  Por favor, inicia sesión para acceder a la aplicación.
                </p>
                <Link to="/login" className="button button--primary button--md cta-link">
                  Ir a Iniciar Sesión
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/vehicles/new" element={<CreateVehiclePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
