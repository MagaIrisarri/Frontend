import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm/RegisterForm.tsx";

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (form: {name:string, last_name: string, email: string, password: string, phone:string, dni:string, birthDate: string}) => {
    console.log("Registrate completando:",form);
    // acá va la llamada al backend
    navigate("/home");
  };

  return (
    <div className="page">
      <div className="card card-wide">
        <h1>Crear cuenta</h1>
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