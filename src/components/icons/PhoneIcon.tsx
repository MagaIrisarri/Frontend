"use client";

import { forwardRef, useImperativeHandle } from "react";
import { motion, useReducedMotion, useAnimationControls, type Variants } from "motion/react";
import type { SVGProps } from "react";

export interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

const phoneVariants: Variants = {
  normal: {
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: {
    rotate: [0, 7, -5.5, 4.5, -2.5, 0],
    transition: {
      duration: 0.8,
      times: [0, 0.15, 0.35, 0.6, 0.9, 1],
      ease: "easeInOut",
    },
  },
};

const PhoneIcon = forwardRef<IconHandle, IconProps>(
  ({ size = 24, className, ...props }, ref) => {
    const controls = useAnimationControls();
    const prefersReducedMotion = useReducedMotion();

    useImperativeHandle(ref, () => ({
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    }));

    const handleMouseEnter = () => {
      controls.start("animate");
    };

    const handleMouseLeave = () => {
      controls.start("normal");
    };

    const pathD =
      "M164.39,145.34a8,8,0,0,1,7.59-.69l47.16,21.13a8,8,0,0,1,4.8,8.3A48.33,48.33,0,0,1,176,216,136,136,0,0,1,40,80,48.33,48.33,0,0,1,81.92,32.06a8,8,0,0,1,8.3,4.8l21.13,47.2a8,8,0,0,1-.66,7.53L89.32,117a7.93,7.93,0,0,0-.54,7.81c8.27,16.93,25.77,34.22,42.75,42.41a7.92,7.92,0,0,0,7.83-.59Z";

    if (prefersReducedMotion) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 256 256"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          {...props}
        >
          <path d={pathD} />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.g
          variants={phoneVariants}
          initial="normal"
          animate={controls}
          style={{ transformOrigin: "117.1px 138.4px" }}
        >
          <path d={pathD} />
        </motion.g>
      </svg>
    );
  }
);

PhoneIcon.displayName = "PhoneIcon";

export { PhoneIcon };