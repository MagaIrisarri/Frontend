import "./Button.scss";

type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  onClick?: () => void;
};

const Button = ({ children, type = "button", variant = "primary", size = "md", onClick }: ButtonProps) => (
  <button type={type} className={`button button--${variant} button--${size}`} onClick={onClick}>
    {children}
  </button>
);

export default Button;
