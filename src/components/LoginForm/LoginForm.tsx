import { useState } from "react";
import Input from "../Input/Input";
import Button from "../shared/Button/Button";
import { formInitialState } from "./LoginForm.data";
import "./LoginForm.scss";

type LoginFormProps = {
  onSubmit: (email: string, password: string) => void;
};

const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [form, setForm] = useState(formInitialState);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, attr: string) =>
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form.email, form.password);
    setForm(formInitialState);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange(e, "email")} />
      <Input label="Contraseña" type="password" value={form.password} onChange={(e) => handleChange(e, "password")} />
      <Button type="submit" variant="primary" size="md">Ingresar</Button>
    </form>
  );
};

export default LoginForm;
