import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const Empty = forwardRef(({ 
  className,
  title = "No data found",
  message = "Get started by adding your first item.",
  action,
  actionLabel = "Get Started",
  icon = "Database",
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 p-8",
        className
      )}
      {...props}
    >
      <div className="relative">
        <div className="h-32 w-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center">
          <ApperIcon name={icon} className="h-16 w-16 text-blue-500" />
        </div>
        <div className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <ApperIcon name="Plus" className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="space-y-3 max-w-md">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-gray-600 text-lg leading-relaxed">
          {message}
        </p>
      </div>

      {action && (
        <Button 
          onClick={action}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <ApperIcon name="Plus" className="w-5 h-5 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
});

Empty.displayName = "Empty";

export default Empty;