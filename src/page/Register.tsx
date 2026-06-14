import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [last_name, setLast_name] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDNI] = useState("");
  const [birthDate, setBirthDate] = useState("");
  

  const handleLogin = () => {
    console.log("Registrar con:", name, last_name, email, password, phone, dni, birthDate);
    // acá va la llamada al backend
    navigate("/home"); // redirige al dashboard si el login es exitoso
  };

  return (
    <div>
      <h1>Iniciar sesión</h1>

      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Apellido"
        value={last_name}
        onChange={(e) => setLast_name(e.target.value)}
      />

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

      <input
        type="tel"
        placeholder="Telefono"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        type="number"
        placeholder="DNI"
        value={dni}
        onChange={(e) => setDNI(e.target.value)}
      />

      <input
        type="date"
        placeholder="Fecha de nacimiento"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />


      <button onClick={handleLogin}>Ingresar</button>
    </div>
  );
};

export default Register;