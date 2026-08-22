import { useState } from "react";
import Input from "../shared/Input/Input";
import Button from "../shared/Button/Button";
import { formUpdatePassword } from "../../types/UserType.data";
import "./ChangePasswordForm.scss";

type ChangePasswordFormProps = {
  onSubmit: (form: { currentPassword: string; newPassword: string }) => void;
};

const ChangePasswordForm = ({ onSubmit }: ChangePasswordFormProps) => {
  const [form, setForm] = useState(formUpdatePassword);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, attr: keyof typeof form) =>
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setFormError("Completá los tres campos.");
      return;
    }

    if (form.newPassword.length < 8) {
      setFormError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setFormError(null);
    onSubmit({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    setForm(formUpdatePassword);
  };

  return (
    <form className="change-password-form" onSubmit={handleSubmit}>
      <h2>Cambiar contraseña</h2>
      {formError && <p className="form-error">{formError}</p>}
      <Input label="Contraseña actual" type="password" value={form.currentPassword} onChange={(e) => handleChange(e, "currentPassword")} required />
      <Input label="Nueva contraseña" type="password" value={form.newPassword} onChange={(e) => handleChange(e, "newPassword")} required />
      <Input label="Confirmar contraseña" type="password" value={form.confirmPassword} onChange={(e) => handleChange(e, "confirmPassword")} required />
      <p className="field-hint">Mínimo 8 caracteres</p>
      <Button type="submit" variant="secondary" size="md">Actualizar contraseña</Button>
    </form>
  );
};

export default ChangePasswordForm;
