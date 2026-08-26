import React from "react";
import "./ShineBorder.scss";

type TColorProp = string | string[];

interface ShineBorderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children?: React.ReactNode;
}

export const ShineBorder: React.FC<ShineBorderProps> = ({
  borderRadius = 16,
  borderWidth = 2,
  duration = 8,
  color = ["#2563EB", "#38BDF8", "#818CF8"],
  className = "",
  children,
  style,
  ...props
}) => {
  const gradientColors = Array.isArray(color) ? color.join(", ") : color;

  return (
    <div
      style={{
        borderRadius: `${borderRadius}px`,
        ...style,
      }}
      className={`shine-border-container ${className}`}
      {...props}
    >
      <div
        className="shine-border-effect"
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--border-radius": `${borderRadius}px`,
            "--duration": `${duration}s`,
            "--shine-gradient": `radial-gradient(transparent, transparent, ${gradientColors}, transparent, transparent)`,
          } as React.CSSProperties
        }
      />
      {children}
    </div>
  );
};