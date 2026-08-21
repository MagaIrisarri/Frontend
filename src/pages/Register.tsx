import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm/RegisterForm.tsx";
import { createUser } from "../services/User.ts";
import { useState } from "react";
import type { formInitialState } from "../types/UserType.data.ts";

const Register = () => {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (form: typeof formInitialState) => {
    console.log("Registrate completando:", form);

    try {
      const user = await createUser(form);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("No se pudo completar el registro. Intentá de nuevo.");
    }
  };

  return (
    <div className="page">
      <div className="card card-wide">
        <h1>Crear cuenta</h1>
        {error && <p className="form-error">{error}</p>}
        <RegisterForm onSubmit={handleRegister} />
        <p className="form-footer">
          ¿Ya tenés cuenta?{" "}
          <button className="btn-link" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
