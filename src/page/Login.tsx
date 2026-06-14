import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Iniciando sesión con:", email, password);
    // acá va la llamada al backend
    navigate("/home"); // redirige al dashboard si el login es exitoso
  };

  const handleRegistro = () => {
    navigate("/register"); // redirige a la pantalla de registro
  };

  return (
    <div>
      <h1>Iniciar sesión</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Ingresar</button>
      <button onClick={handleRegistro}>Registrarse</button>
    </div>
  );
};

export default Login;