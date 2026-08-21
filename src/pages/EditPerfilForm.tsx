import { useNavigate } from "react-router-dom";
import EditPerfilForm from "../components/EditPerfilForm/EditPerfilForm.tsx";
import ChangePasswordForm from "../components/ChangePasswordForm/ChangePasswordForm.tsx";
import { getUserId, updateUser, changePassword, removeUser} from "../services/User.ts";
import { useEffect, useState } from "react";
import { formUpdate } from "../types/UserType.data.ts";
import Button from "../components/shared/Button/Button.tsx";

const Update = () => {
  const user = JSON.parse(localStorage.getItem("user") ?? "null");
  const id = user?.id;
  const navigate = useNavigate();

  const [userData, setUserData] = useState<typeof formUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    getUserId(id).then((data) => {
      setUserData({
        name: data.name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
      });
    });
  }, [id]);

  const handleUpdate = async (form: typeof formUpdate) => {
    console.log(" Modifica:", form);

    try {
      await updateUser(id, form);
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("No se pudieron guardar los cambios. Intentá de nuevo.");
    }
  };

  const handlePasswordChange = async (form: { currentPassword: string; newPassword: string }) => {
    try {
      await changePassword(id, form.currentPassword, form.newPassword);
      setPasswordError(null);
      setPasswordSuccess("Contraseña actualizada correctamente.");
    } catch (err) {
      console.error(err);
      setPasswordSuccess(null);
      setPasswordError("No se pudo cambiar la contraseña. Verificá la contraseña actual.");
    }
  };

  const [mostrarModal, setMostrarModal] = useState(false);

  const Remove  = async () => {
    console.log(" Eliminar cuenta:");
    try {
      await removeUser(id);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("No se pudo elimar la cuenta. Intentá de nuevo.");
    }
    setMostrarModal(false);
};

  return (
    <div className="page">
      <div className="card card-wide">
        <h1>Editar datos personales</h1>
        {error && <p className="form-error">{error}</p>}
        {userData ? (
          <EditPerfilForm onSubmit={handleUpdate} initialData={userData} />
        ) : (
          <p>Cargando...</p>
        )}
        <div style={{ marginTop: "32px" }}></div>
        {passwordError && <p className="form-error">{passwordError}</p>}
        {passwordSuccess && <p className="form-success">{passwordSuccess}</p>}
        <ChangePasswordForm onSubmit={handlePasswordChange} />

        <div style={{ marginTop: "32px" }}></div>
          <Button type="submit" variant="primary" size="sm" onClick={() => setMostrarModal(true)}>Eliminar cuenta</Button>

            {mostrarModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <p className="form-footer"> ¿Estás seguro de que querés eliminar tu cuenta?</p>
                  <Button type="submit" variant="secondary" size="md" onClick={Remove}>Sí, eliminar</Button>
                  <Button type="submit" variant="secondary" size="md" onClick={() => setMostrarModal(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          <p className="form-footer">
          <button className="btn-link" onClick={() => navigate("/home")}>
            Cancelar
          </button>
        </p>
      </div>
    </div>
  );
};

export default Update;
