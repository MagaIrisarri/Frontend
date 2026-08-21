import "./Input.scss";

type InputProps = {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  full?: boolean;
};

const Input = ({ label, type, value, onChange, full }: InputProps) => (
  <label className={full ? "field field--full" : "field"}>
    <span className="field__label">{label}</span>
    <input className="field__input" type={type} placeholder={label} value={value} onChange={onChange} />
  </label>
);

export default Input;
