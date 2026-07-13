import { useState } from "react";
import Input from "../Input/Input";
import Button from "../shared/Button/Button";
import { formUpdate } from "../../types/UserType.data";
import "./EditPerfilForm.scss";

type EditPerfilFormProps = {
  onSubmit: (form: typeof formUpdate) => void;
  initialData: typeof formUpdate;
};

const EditPerfilForm = ({ onSubmit, initialData }: EditPerfilFormProps) => {
  const [form, setForm] = useState(initialData);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, attr: keyof typeof form) =>
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleNumericChange = (event: React.ChangeEvent<HTMLInputElement>, attr: "phone") => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setForm((prevForm) => ({ ...prevForm, [attr]: digitsOnly }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setFormError("Los campos no pueden estar vacíos ni contener solo espacios.");
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
    });
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      {formError && <p className="form-error">{formError}</p>}
      <Input label="Nombre" type="text" value={form.name} onChange={(e) => handleChange(e, "name")}  required />
      <Input label="Apellido" type="text" value={form.last_name} onChange={(e) => handleChange(e, "last_name")} required />
      <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange(e, "email")} required />
      <Input label="Telefono" type="tel" value={form.phone} onChange={(e) => handleNumericChange(e, "phone")} required />
      <Button type="submit" variant="primary" size="md">Guardar cambios</Button>
    </form>
  );
};

export default EditPerfilForm;
