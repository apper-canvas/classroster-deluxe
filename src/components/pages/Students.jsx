import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "@/components/atoms/Button";
import SearchBar from "@/components/molecules/SearchBar";
import StudentTable from "@/components/organisms/StudentTable";
import StudentModal from "@/components/organisms/StudentModal";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import Modal from "@/components/molecules/Modal";
import studentService from "@/services/api/studentService";

const Students = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    loadStudents();
    
    // Check if we should open add modal from URL params
    if (searchParams.get("action") === "add") {
      handleAddStudent();
      // Clear the URL parameter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await studentService.getAll();
      setStudents(data);
    } catch (err) {
      setError("Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) ||
             student.studentId.toLowerCase().includes(search) ||
             student.email.toLowerCase().includes(search) ||
             student.grade.toLowerCase().includes(search);
    });

    setFilteredStudents(filtered);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    // Update URL search params
    if (term.trim()) {
      setSearchParams({ search: term });
    } else {
      setSearchParams({});
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await studentService.delete(studentToDelete.id);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      toast.success("Student deleted successfully");
    } catch (error) {
      toast.error("Failed to delete student");
    } finally {
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedStudent(null);
    
    // Refresh students list if a student was added/edited
    if (modalMode === "create" || modalMode === "edit") {
      loadStudents();
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView onRetry={loadStudents} />;

  if (students.length === 0) {
    return (
      <Empty
        title="No Students Yet"
        message="Start building your class roster by adding your first student."
        actionLabel="Add First Student"
        action={handleAddStudent}
        icon="Users"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Students
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your class roster and student information
          </p>
        </div>
        <Button 
          onClick={handleAddStudent}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name, student ID, email, or grade..."
            className="w-full"
          />
        </div>
        <div className="flex items-center text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
          <ApperIcon name="Users" className="h-4 w-4 mr-2" />
          {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length > 0 ? (
        <StudentTable
          students={filteredStudents}
          onView={handleViewStudent}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
        />
      ) : (
        <Empty
          title="No Students Found"
          message={searchTerm ? 
            `No students match your search for "${searchTerm}". Try adjusting your search terms.` :
            "No students available to display."
          }
          actionLabel={searchTerm ? "Clear Search" : "Add Student"}
          action={searchTerm ? () => handleSearch("") : handleAddStudent}
          icon="Search"
        />
      )}

      {/* Student Modal */}
      <StudentModal
        isOpen={showModal}
        onClose={handleModalClose}
        student={selectedStudent}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Student"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
            >
              Delete Student
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <ApperIcon name="AlertTriangle" className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Are you sure you want to delete this student?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone. All grades and attendance records will be permanently deleted.
              </p>
            </div>
          </div>
          
          {studentToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {studentToDelete.firstName?.charAt(0)}{studentToDelete.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {studentToDelete.firstName} {studentToDelete.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    ID: {studentToDelete.studentId} • Grade: {studentToDelete.grade}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Students;