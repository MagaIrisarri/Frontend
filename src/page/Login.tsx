import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm/LoginForm.tsx";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (email: string, password: string) => {
    console.log("Iniciando sesión con:", email, password);
    // acá va la llamada al backend
    navigate("/home");
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Iniciar sesión</h1>
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