import ApperIcon from "@/components/ApperIcon";
import Card from "@/components/atoms/Card";
import { cn } from "@/utils/cn";

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  className,
  variant = "default" 
}) => {
  const variants = {
    default: "from-blue-500 to-blue-600",
    success: "from-green-500 to-green-600",
    warning: "from-yellow-500 to-yellow-600",
    danger: "from-red-500 to-red-600"
  };

  return (
    <Card className={cn("p-6 hover:scale-[1.02] transition-all duration-300", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {value}
          </p>
          {trend && (
            <div className={cn(
              "flex items-center text-sm",
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
            )}>
              {trend === "up" && <ApperIcon name="TrendingUp" className="h-4 w-4 mr-1" />}
              {trend === "down" && <ApperIcon name="TrendingDown" className="h-4 w-4 mr-1" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center bg-gradient-to-r text-white",
          variants[variant]
        )}>
          <ApperIcon name={icon} className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;