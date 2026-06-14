import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./page/Login.tsx";
import "./App.css";
import Register from "./page/register.tsx";
import Home from "./page/home.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <h1>Bienvenido al Sistema</h1>
              <p style={{ fontSize: "1.2rem", margin: "1rem 0 2rem" }}>
                Por favor, inicia sesión para acceder a la aplicación.
              </p>
              <Link
                to="/login"
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.5rem",
                  background: "var(--accent, #aa3bff)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  transition: "opacity 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Ir a Iniciar Sesión
              </Link>
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
