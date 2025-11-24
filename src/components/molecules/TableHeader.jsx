import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const TableHeader = ({ 
  title, 
  columns, 
  sortField, 
  sortDirection, 
  onSort 
}) => {
  const handleSort = (field) => {
    if (!onSort) return;
    
    if (sortField === field) {
      onSort(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "asc");
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "text-xs font-medium text-gray-500 uppercase tracking-wide",
              column.className,
              column.sortable && "cursor-pointer hover:text-gray-700 select-none flex items-center gap-1"
            )}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            {column.label}
            {column.sortable && (
              <div className="flex flex-col">
                <ApperIcon 
                  name="ChevronUp" 
                  className={cn(
                    "h-3 w-3 -mb-1",
                    sortField === column.key && sortDirection === "asc" 
                      ? "text-primary-600" 
                      : "text-gray-400"
                  )} 
                />
                <ApperIcon 
                  name="ChevronDown" 
                  className={cn(
                    "h-3 w-3",
                    sortField === column.key && sortDirection === "desc" 
                      ? "text-primary-600" 
                      : "text-gray-400"
                  )} 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableHeader;