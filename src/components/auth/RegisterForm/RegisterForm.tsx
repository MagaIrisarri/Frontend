import { useState } from "react";
import Input from "../../shared/Input/Input";
import Button from "../../shared/Button/Button";
import { formInitialState } from "./RegisterForm.data";
import "./RegisterForm.scss";

type RegisterFormProps = {
  onSubmit: (form: typeof formInitialState) => void;
};

const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
  const [form, setForm] = useState(formInitialState);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, attr: string) =>
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form);
    setForm(formInitialState);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <Input label="Nombre" type="text" value={form.name} onChange={(e) => handleChange(e, "name")} />
      <Input label="Apellido" type="text" value={form.last_name} onChange={(e) => handleChange(e, "last_name")} />
      <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange(e, "email")} />
      <Input label="Contraseña" type="password" value={form.password} onChange={(e) => handleChange(e, "password")} />
      <Input label="Telefono" type="tel" value={form.phone} onChange={(e) => handleChange(e, "phone")} />
      <Input label="DNI" type="text" value={form.dni} onChange={(e) => handleChange(e, "dni")} />
      <Input
        label="Fecha de nacimiento"
        type="date"
        value={form.birthDate}
        onChange={(e) => handleChange(e, "birthDate")}
        full
      />
      <Button type="submit" variant="primary" size="md">Registrarse</Button>
    </form>
  );
};

export default RegisterForm;
