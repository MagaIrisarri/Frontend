import React, { useEffect, useState } from "react";
import { formInitialState } from "./VehicleForm.data";
import { getBrands, getModels, getInsurances } from "../../services/vehicle.service";

type Option = { id: string; name: string };
const unwrap = (res: any): Option[] => (Array.isArray(res) ? res : (res?.data ?? []));

type EditVehicleFormProps = {
  onSubmit: (form: typeof formInitialState) => void;
  initialData?: typeof formInitialState;
  submitLabel?: string;
  onCancel?: () => void;
};

export default function VehicleForm({ onSubmit, initialData, submitLabel, onCancel }: EditVehicleFormProps) {
  const [form, setForm] = useState(initialData ?? formInitialState);
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [insurances, setInsurances] = useState<Option[]>([]);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    getBrands().then((res) => setBrands(unwrap(res))).catch(() => setBrands([]));
    getInsurances().then((res) => setInsurances(unwrap(res))).catch(() => setInsurances([]));
  }, []);

  useEffect(() => {
    if (!form.brandId) {
      setModels([]);
      return;
    }
    getModels(form.brandId).then((res) => setModels(unwrap(res))).catch(() => setModels([]));
  }, [form.brandId]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    attr: keyof typeof formInitialState
  ) => {
    setForm((prevForm) => ({ ...prevForm, [attr]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form);
    setForm(formInitialState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
            Patente / Placa
          </label>
          <input
            type="text"
            placeholder="Ej. AB123CD"
            value={form.plate}
            onChange={(e) => handleChange(e, "plate")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
            Año
          </label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={(e) => handleChange(e, "year")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
            Marca
          </label>
          <select
            value={form.brandId}
            onChange={(e) => handleChange(e, "brandId")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          >
            <option value="">Seleccioná una marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
            Modelo
          </label>
          <select
            value={form.modelId}
            onChange={(e) => handleChange(e, "modelId")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
            required
            disabled={!form.brandId}
          >
            <option value="">
              {form.brandId ? "Seleccioná un modelo" : "Elegí una marca primero"}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
          Seguro (Opcional)
        </label>
        <select
          value={form.insuranceId}
          onChange={(e) => handleChange(e, "insuranceId")}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">Sin seguro especificado</option>
          {insurances.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          {submitLabel ?? "Guardar vehículo"}
        </button>
      </div>
    </form>
  );
}
