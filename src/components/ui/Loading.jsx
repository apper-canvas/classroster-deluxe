import { cn } from "@/utils/cn";

const Loading = ({ className }) => {
  return (
    <div className={cn("animate-pulse space-y-6", className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48"></div>
        <div className="h-10 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg w-32"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24"></div>
                <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48"></div>
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gradient-to-r from-green-200 to-green-300 rounded-full w-20"></div>
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-200 to-blue-300 rounded"></div>
                <div className="h-8 w-8 bg-gradient-to-r from-red-200 to-red-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;