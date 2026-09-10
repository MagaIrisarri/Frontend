import { useEffect, useState } from "react";
import { formInitialState } from "../../components/Vehicle/VehicleForm.data.js";
import Input from "../../components/shared/Input/Input";
import Button from "../../components/shared/Button/Button";
import { getBrands, getModels, getInsurances } from "../../services/vehicleService.js";
import { getVehicleTypes } from "../../services/VehicleType.js";

type Option = { id: string; name: string };

const unwrap = (res: any): Option[] => (Array.isArray(res) ? res : (res?.data ?? []));

type EditVehicleFormProps = {
  onSubmit: (form: typeof formInitialState) => void;
  initialData?: typeof formInitialState;
  submitLabel?: string;
};

const ParkingForm = ({ onSubmit, initialData, submitLabel }: EditVehicleFormProps) => {
  const [form, setForm] = useState(initialData ?? formInitialState);
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [insurances, setInsurances] = useState<Option[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<Option[]>([]);

  useEffect(() => {
    getBrands().then((res) => setBrands(unwrap(res))).catch(() => setBrands([]));
    getInsurances().then((res) => setInsurances(unwrap(res))).catch(() => setInsurances([]));
    getVehicleTypes().then((res) => setVehicleTypes(unwrap(res))).catch(() => setVehicleTypes([]));
  }, []);

  useEffect(() => {
    if (!form.brandId) {
      setModels([]);
      return;
    }
    getModels(form.brandId).then((res) => setModels(unwrap(res))).catch(() => setModels([]));
  }, [form.brandId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, attr: string) =>

    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form);
    setForm(formInitialState);
  };

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <Input label="Patente" type="text" value={form.plate} onChange={(e) => handleChange(e, "plate")} required />
      <Input label="Año" type="number" value={form.year} onChange={(e) => handleChange(e, "year")} required />
      <label className="field">
        <span className="field__label">Marca</span>
        <select className="field__input" value={form.brandId} onChange={(e) => handleChange(e, "brandId")} required>
          <option value="">Seleccioná una marca</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Modelo</span>
        <select className="field__input" value={form.modelId} onChange={(e) => handleChange(e, "modelId")} required disabled={!form.brandId}>
          <option value="">{form.brandId ? "Seleccioná un modelo" : "Elegí una marca primero"}</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Seguro</span>
        <select className="field__input" value={form.insuranceId} onChange={(e) => handleChange(e, "insuranceId")}>
          <option value="">Sin seguro especificado</option>
          {insurances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </label>

      <Button type="submit" variant="primary" size="md">{submitLabel ?? 'Guardar vehículo'}</Button>
    </form>
  );
};

export default ParkingForm;