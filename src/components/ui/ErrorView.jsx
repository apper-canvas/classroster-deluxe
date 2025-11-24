import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const ErrorView = forwardRef(({ 
  className, 
  title = "Something went wrong",
  message = "We encountered an error while loading your data. Please try again.",
  onRetry,
  showRetry = true,
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
        <div className="h-24 w-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
          <ApperIcon name="AlertTriangle" className="h-12 w-12 text-red-600" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
          <ApperIcon name="X" className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className="space-y-3 max-w-md">
        <h3 className="text-xl font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {message}
        </p>
      </div>

      {showRetry && onRetry && (
        <Button 
          onClick={onRetry}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <ApperIcon name="RefreshCw" className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
});

ErrorView.displayName = "ErrorView";

export default ErrorView;