import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./page/Login.tsx";
import "./App.css";
import Register from "./page/Register.tsx";
import Home from "./page/Home.tsx";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
