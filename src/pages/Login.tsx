import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm/LoginForm.tsx";
import { useState } from "react";
import { loginUser } from "../services/User.ts";

const Login = () => {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    console.log("Iniciando sesión con:", email, password);
    try {
          await loginUser(email, password);
          navigate("/home");
        } catch (err) {
          console.error(err);
          setError("No se pudo completar el registro. Intentá de nuevo.");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Iniciar sesión</h1>
         {error && <p className="form-error">{error}</p>}
        <LoginForm onSubmit={handleLogin} />
        <p className="form-footer">
          ¿No tenés cuenta?{" "}
          <button className="btn-link" onClick={() => navigate("/register")}>
            Registrate
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;