import { useState } from "react";
import { formInitialState } from "../../components/Parking/ParkingForm.data.js";
import Input from "../../components/shared/Input/Input";
import Button from "../../components/shared/Button/Button";

type ParkingFormProps = {
  onSubmit: (form: typeof formInitialState) => void;}

const ParkingForm = ({ onSubmit }: ParkingFormProps) => {
  const [form, setForm] = useState(formInitialState);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, attr: string) =>
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form);
    setForm(formInitialState);
  };

  return (
    <form className="parking-form" onSubmit={handleSubmit}>
      <Input label="Nombre" type="text" value={form.name} onChange={(e) => handleChange(e, "name")} required />
      <Input label="Localidad" type="text" value={form.locality} onChange={(e) => handleChange(e, "locality")} required/>
      <Input label="Codigo postal" type="number" value={form.postalCode} onChange={(e) => handleChange(e, "postalCode")} required/>
      <Input label="Dirección" type="text" value={form.address} onChange={(e) => handleChange(e, "address")} required/>
      <Input label="Capacidad para autos" type="number" value={form.carCapacity} onChange={(e) => handleChange(e, "carCapacity")} required/>
      <Input label="Capacidad para motos" type="number" value={form.motorcycleCapacity} onChange={(e) => handleChange(e, "motorcycleCapacity")} required/>
      <Input label="Capacidad para camiones" type="number" value={form.truckCapacity} onChange={(e) => handleChange(e, "truckCapacity")} />
      <Input label="Hora de apertura" type="time" value={form.openingTime} onChange={(e) => handleChange(e, "openingTime")} required />
      <Input label="Hora de cierre" type="time" value={form.closingTime} onChange={(e) => handleChange(e, "closingTime")} required />
      <Input label="Horas mínimas de reserva" type="number" value={form.minReservationHours} onChange={(e) => handleChange(e, "minReservationHours")} required />
      <Input label="Horas máximas de reserva" type="number" value={form.maxReservationHours} onChange={(e) => handleChange(e, "maxReservationHours")} required />
      <Input label="Margen de reserva (hs)" type="number" value={form.reservationMargin} onChange={(e) => handleChange(e, "reservationMargin")} required />
      <Button type="submit" variant="primary" size="md">Crear estacionamiento</Button>
    </form>
  );
};

export default ParkingForm;