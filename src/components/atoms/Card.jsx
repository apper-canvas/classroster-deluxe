import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Card = forwardRef(({ 
  className, 
  variant = "default",
  children, 
  ...props 
}, ref) => {
  const variants = {
    default: "bg-white border border-gray-200 shadow-card",
    elevated: "bg-white border border-gray-200 shadow-elevated",
    gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-card"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl transition-shadow duration-200 hover:shadow-elevated",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

export default Card;