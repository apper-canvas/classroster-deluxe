import { useNavigate } from "react-router-dom";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="relative">
          <div className="h-32 w-32 mx-auto bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <ApperIcon name="AlertTriangle" className="h-16 w-16 text-red-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">404</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Page Not Found
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)}
            variant="secondary"
            className="flex items-center justify-center"
          >
            <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 flex items-center justify-center"
          >
            <ApperIcon name="Home" className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact your system administrator or try searching for what you need.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;