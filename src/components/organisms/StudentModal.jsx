import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/molecules/Modal";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Badge from "@/components/atoms/Badge";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import studentService from "@/services/api/studentService";
import gradeService from "@/services/api/gradeService";
import attendanceService from "@/services/api/attendanceService";

const StudentModal = ({ 
  isOpen, 
  onClose, 
  student, 
  mode = "view" // view, edit, create
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    grade: "",
    section: "",
    status: "Active"
  });
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: "profile", label: "Profile", icon: "User" },
    { id: "grades", label: "Grades", icon: "Award" },
    { id: "attendance", label: "Attendance", icon: "Calendar" }
  ];

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        studentId: student.studentId || "",
        dateOfBirth: student.dateOfBirth || "",
        email: student.email || "",
        phone: student.phone || "",
        address: student.address || "",
        grade: student.grade || "",
        section: student.section || "",
        status: student.status || "Active"
      });
      
      if (mode === "view") {
        loadStudentData(student.id);
      }
    } else {
      // Reset form for new student
      setFormData({
        firstName: "",
        lastName: "",
        studentId: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        address: "",
        grade: "",
        section: "",
        status: "Active"
      });
    }
    setActiveTab("profile");
    setErrors({});
  }, [student, mode]);

  const loadStudentData = async (studentId) => {
    try {
      setLoading(true);
      const [gradesData, attendanceData] = await Promise.all([
        gradeService.getByStudentId(studentId),
        attendanceService.getByStudentId(studentId)
      ]);
      setGrades(gradesData);
      setAttendance(attendanceData);
    } catch (error) {
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.studentId.trim()) newErrors.studentId = "Student ID is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.grade.trim()) newErrors.grade = "Grade is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      setLoading(true);
      
      if (mode === "create") {
        await studentService.create(formData);
        toast.success("Student created successfully");
      } else {
        await studentService.update(student.id, formData);
        toast.success("Student updated successfully");
      }
      
      onClose();
    } catch (error) {
      toast.error("Failed to save student");
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active": return "success";
      case "inactive": return "error";
      case "suspended": return "warning";
      default: return "default";
    }
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === "Present").length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const calculateAverageGrade = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.percentage, 0);
    return Math.round(total / grades.length);
  };

  const modalTitle = mode === "create" ? "Add New Student" : 
                   mode === "edit" ? "Edit Student" : 
                   `${formData.firstName} ${formData.lastName}`;

  const footer = mode !== "view" ? (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button 
        onClick={handleSave}
        disabled={loading}
        className="min-w-[100px]"
      >
        {loading ? "Saving..." : "Save"}
      </Button>
    </>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      footer={footer}
    >
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <ApperIcon name={tab.icon} className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={errors.firstName}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={errors.lastName}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                error={errors.studentId}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
              <Input
                label="Grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                error={errors.grade}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
              {mode !== "create" && (
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={mode === "view"}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </Select>
              )}
            </div>
          </div>
        )}

        {activeTab === "grades" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading grades...</p>
              </div>
            ) : grades.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Academic Performance</h4>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Average Grade</p>
                    <p className="text-2xl font-bold text-primary-600">{calculateAverageGrade()}%</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {grades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{grade.subject}</p>
                        <p className="text-sm text-gray-600">{grade.term} • {format(new Date(grade.date), "MMM dd, yyyy")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{grade.marks}/{grade.maxMarks}</p>
                        <Badge variant={grade.percentage >= 80 ? "success" : grade.percentage >= 60 ? "warning" : "error"}>
                          {grade.percentage}% ({grade.gradeLetter})
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <ApperIcon name="Award" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No grades recorded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading attendance...</p>
              </div>
            ) : attendance.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Attendance Record</h4>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-green-600">{calculateAttendancePercentage()}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </p>
                        {record.remarks && (
                          <p className="text-xs text-gray-600">{record.remarks}</p>
                        )}
                      </div>
                      <Badge variant={record.status === "Present" ? "success" : "error"}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <ApperIcon name="Calendar" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No attendance records yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StudentModal;