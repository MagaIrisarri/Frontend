import { useState } from "react";
import Input from "../Input/Input";
import Button from "../shared/Button/Button";
import { formInitialState } from "../../types/UserType.data";
import "./RegisterForm.scss";

type RegisterFormProps = {
  onSubmit: (form: typeof formInitialState) => void;
};

type TipoUsuario = "CLIENTE" | "DUEÑO";


const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
  const [form, setForm] = useState(formInitialState);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, attr: keyof typeof form) =>
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleNumericChange = (event: React.ChangeEvent<HTMLInputElement>, attr: "dni" | "phone") => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setForm((prevForm) => ({ ...prevForm, [attr]: digitsOnly }));
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, attr: "type") => {
    const value = event.target.value as TipoUsuario;
    setForm((prevForm) => ({ ...prevForm, [attr]: value }));
};
  

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.last_name.trim() || !form.password.trim()) {
      setFormError("Los campos no pueden estar vacíos ni contener solo espacios.");
      return;
    }

    if (!/^\d{7,8}$/.test(form.dni)) {
      setFormError("El DNI debe tener 7 u 8 dígitos, sin letras.");
      return;
    }

    if (!form.phone) {
      setFormError("El teléfono es requerido.");
      return;
    }

    setFormError(null);
    onSubmit({
      ...form,
      name: form.name.trim(),
      last_name: form.last_name.trim(),
      password: form.password.trim(),
    });
    setForm(formInitialState);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      {formError && <p className="form-error">{formError}</p>}
      <Input label="Nombre" type="text" value={form.name} onChange={(e) => handleChange(e, "name")} required />
      <Input label="Apellido" type="text" value={form.last_name} onChange={(e) => handleChange(e, "last_name")} required />
      <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange(e, "email")} required />
      <Input label="Contraseña" type="password" value={form.password} onChange={(e) => handleChange(e, "password")} required />
      <Input label="Telefono" type="tel" value={form.phone} onChange={(e) => handleNumericChange(e, "phone")} required />
      <Input label="DNI" type="text" value={form.dni} onChange={(e) => handleNumericChange(e, "dni")} maxLength={8} required />
      <Input label="Fecha de nacimiento" type="date" value={form.date_of_brthdate} onChange={(e) => handleChange(e, "date_of_brthdate")} full required />
      <select value={form.type} onChange={(e) => handleSelectChange(e, "type")}><option value="">Seleccione tipo de usuario</option><option value="CLIENTE">Cliente</option><option value="DUEÑO">Dueño</option></select>
      <Button type="submit" variant="primary" size="md">Registrarse</Button>
    </form>
  );
};

export default RegisterForm;
