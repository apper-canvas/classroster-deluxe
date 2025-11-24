import { useState } from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import TableHeader from "@/components/molecules/TableHeader";
import { cn } from "@/utils/cn";
import { format } from "date-fns";

const StudentTable = ({ 
  students, 
  onView, 
  onEdit, 
  onDelete,
  loading = false 
}) => {
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

const columns = [
    { key: "avatar", label: "", className: "col-span-1" },
    { key: "name", label: "Name", sortable: true, className: "col-span-2" },
    { key: "studentId", label: "Student ID", sortable: true, className: "col-span-2" },
    { key: "grade", label: "Grade", sortable: true, className: "col-span-1" },
    { key: "tags", label: "Tags", className: "col-span-2" },
    { key: "status", label: "Status", sortable: true, className: "col-span-2" },
    { key: "enrollmentDate", label: "Enrolled", sortable: true, className: "col-span-1" },
    { key: "actions", label: "Actions", className: "col-span-1" }
  ];

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

const sortedStudents = [...students].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === "name") {
      aValue = `${a.firstName_c || a.firstName || ''} ${a.lastName_c || a.lastName || ''}`;
      bValue = `${b.firstName_c || b.firstName || ''} ${b.lastName_c || b.lastName || ''}`;
    }
    
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "suspended":
        return "warning";
      default:
        return "default";
    }
  };

const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <TableHeader title="Students" columns={columns} />
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="col-span-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="col-span-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="col-span-1">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="col-span-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="col-span-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="col-span-1 flex space-x-1">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <TableHeader
        title="Students"
        columns={columns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
      
      <div className="divide-y divide-gray-100">
        {sortedStudents.map((student, index) => (
          <div
key={student.Id || student.id}
            className={cn(
              "px-6 py-4 hover:bg-gray-50 transition-colors duration-150",
              index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
)}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Avatar */}
              <div className="col-span-1">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(student.firstName_c || student.firstName, student.lastName_c || student.lastName)}
                </div>
              </div>

{/* Name */}
              <div className="col-span-2">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-900">
                    {student.firstName_c || student.firstName} {student.lastName_c || student.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{student.email_c || student.email}</p>
                </div>
              </div>

              {/* Student ID */}
<div className="col-span-2">
                <p className="text-sm font-medium text-gray-900">{student.studentId_c || student.studentId}</p>
              </div>

              {/* Grade */}
<div className="col-span-1">
                <p className="text-sm font-medium text-gray-900">{student.grade_c || student.grade}</p>
</div>

              {/* Tags */}
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1">
                  {student.Tags && student.Tags.trim() ? (
                    student.Tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No tags</span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <Badge variant={getStatusVariant(student.status_c || student.status)}>
                  {student.status_c || student.status}
                </Badge>
              </div>

{/* Enrollment Date */}
              <div className="col-span-1">
                <p className="text-sm text-gray-600">
                  {format(new Date(student.enrollmentDate_c || student.enrollmentDate), "MMM dd, yyyy")}
                </p>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView?.(student)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                  >
                    <ApperIcon name="Eye" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(student)}
                    className="h-8 w-8 p-0 hover:bg-yellow-100 hover:text-yellow-600"
                  >
                    <ApperIcon name="Edit" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(student)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <ApperIcon name="Trash2" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StudentTable;