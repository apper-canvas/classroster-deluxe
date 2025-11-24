import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import studentService from "@/services/api/studentService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Badge from "@/components/atoms/Badge";
import Attendance from "@/components/pages/Attendance";
import Modal from "@/components/molecules/Modal";
import { cn } from "@/utils/cn";

const StudentModal = ({ 
  isOpen, 
  onClose, 
  student, 
  mode = "view" // view, edit, create
}) => {
  const [activeTab, setActiveTab] = useState("profile");
const [formData, setFormData] = useState({
    firstName_c: "",
    lastName_c: "",
    studentId_c: "",
    dateOfBirth_c: "",
    email_c: "",
    phone_c: "",
    address_c: "",
    grade_c: "",
    section_c: "",
    status_c: "Active"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

const tabs = [
    { id: "profile", label: "Profile", icon: "User" }
  ];

  useEffect(() => {
    if (student) {
      setFormData({
firstName_c: student.firstName_c || student.firstName || "",
        lastName_c: student.lastName_c || student.lastName || "",
        studentId_c: student.studentId_c || student.studentId || "",
        dateOfBirth_c: student.dateOfBirth_c || student.dateOfBirth || "",
        email_c: student.email_c || student.email || "",
        phone_c: student.phone_c || student.phone || "",
        address_c: student.address_c || student.address || "",
        grade_c: student.grade_c || student.grade || "",
        section_c: student.section_c || student.section || "",
        status_c: student.status_c || student.status || "Active"
});
      
if (mode === "view") {
        // Student data is already passed via props
      }
    } else {
      // Reset form for new student
      setFormData({
        firstName_c: "",
        lastName_c: "",
        studentId_c: "",
        dateOfBirth_c: "",
        email_c: "",
        phone_c: "",
        address_c: "",
        grade_c: "",
        section_c: "",
        status_c: "Active"
      });
    }
    setActiveTab("profile");
    setErrors({});
  }, [student, mode]);


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
    
if (!formData.firstName_c.trim()) newErrors.firstName_c = "First name is required";
    if (!formData.lastName_c.trim()) newErrors.lastName_c = "Last name is required";
    if (!formData.studentId_c.trim()) newErrors.studentId_c = "Student ID is required";
    if (!formData.email_c.trim()) newErrors.email_c = "Email is required";
    if (formData.email_c && !/\S+@\S+\.\S+/.test(formData.email_c)) {
      newErrors.email_c = "Invalid email format";
    }
    if (!formData.grade_c.trim()) newErrors.grade_c = "Grade is required";
    
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
        await studentService.update(student.Id || student.id, formData);
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


const modalTitle = mode === "create" ? "Add New Student" : 
                   mode === "edit" ? "Edit Student" : 
                   `${formData.firstName_c} ${formData.lastName_c}`;

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
                name="firstName_c"
                value={formData.firstName_c}
                onChange={handleInputChange}
                error={errors.firstName_c}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Last Name"
                name="lastName_c"
                value={formData.lastName_c}
                onChange={handleInputChange}
                error={errors.lastName_c}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Student ID"
                name="studentId_c"
                value={formData.studentId_c}
                onChange={handleInputChange}
                error={errors.studentId_c}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth_c"
                type="date"
                value={formData.dateOfBirth_c}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
              <Input
                label="Email"
                name="email_c"
                type="email"
                value={formData.email_c}
                onChange={handleInputChange}
                error={errors.email_c}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Phone"
                name="phone_c"
                value={formData.phone_c}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
              <Input
                label="Grade"
                name="grade_c"
                value={formData.grade_c}
                onChange={handleInputChange}
                error={errors.grade_c}
                required
                disabled={mode === "view"}
              />
              <Input
                label="Section"
                name="section_c"
                value={formData.section_c}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Address"
                name="address_c"
                value={formData.address_c}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
              {mode !== "create" && (
                <Select
                  label="Status"
                  name="status_c"
                  value={formData.status_c}
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

      </div>
    </Modal>
  );
};

export default StudentModal;