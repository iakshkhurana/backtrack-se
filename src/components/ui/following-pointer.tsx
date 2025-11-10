import React, { useEffect, useState } from "react";

import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export const FollowerPointerCard = ({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string | React.ReactNode;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isInside, setIsInside] = useState<boolean>(false);
  // Track if device is desktop (has precise pointing device like mouse/trackpad)
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  /**
   * Check if device is desktop (has precise pointing device)
   * Only show following-pointer on desktop devices, not on mobile/touch devices
   */
  useEffect(() => {
    // Check if device has precise pointing device (mouse/trackpad)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsDesktop(mediaQuery.matches);

    // Listen for changes (e.g., when device orientation changes)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rect) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      // Position at exact cursor location (will be centered by transform)
      x.set(e.clientX - rect.left + scrollX);
      y.set(e.clientY - rect.top + scrollY);
    }
  };
  const handleMouseLeave = () => {
    setIsInside(false);
  };

  const handleMouseEnter = () => {
    setIsInside(true);
  };
  
  /**
   * Only show following-pointer on desktop devices
   * On mobile/touch devices, use default cursor behavior
   */
  return (
    <div
      onMouseLeave={isDesktop ? handleMouseLeave : undefined}
      onMouseEnter={isDesktop ? handleMouseEnter : undefined}
      onMouseMove={isDesktop ? handleMouseMove : undefined}
      style={{
        cursor: isDesktop ? "none" : "default",
      }}
      ref={ref}
      className={cn("relative", isDesktop ? "[&_*]:cursor-none" : "", className)}
    >
      <AnimatePresence>
        {isDesktop && isInside ? <FollowPointer x={x} y={y} title={title} /> : null}
      </AnimatePresence>
      {children}
    </div>
  );
};

export const FollowPointer = ({
  x,
  y,
  title,
}: {
  x: any;
  y: any;
  title?: string | React.ReactNode;
}) => {
  const colors = [
    "#0ea5e9",
    "#737373",
    "#14b8a6",
    "#22c55e",
    "#3b82f6",
    "#ef4444",
    "#eab308",
  ];
  return (
    <motion.div
      className="absolute z-[100] rounded-full -translate-x-1/2 -translate-y-1/2"
      style={{
        top: y,
        left: x,
        pointerEvents: "none",
        width: "16px",
        height: "16px",
      }}
      initial={{
        scale: 1,
        opacity: 1,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
      }}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="1"
        viewBox="0 0 16 16"
        className="h-6 w-6 -translate-x-[12px] -translate-y-[12px] -rotate-[70deg] transform stroke-sky-600 text-sky-500"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"></path>
      </svg>
      {title && (
        <motion.div
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          }}
          initial={{
            scale: 0.5,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: 0.5,
            opacity: 0,
          }}
          className={
            "min-w-max rounded-full bg-neutral-200 px-2 py-2 text-xs whitespace-nowrap text-white"
          }
        >
          {title}
        </motion.div>
      )}
    </motion.div>
  );
};
