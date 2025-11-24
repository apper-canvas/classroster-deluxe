import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import SearchBar from "@/components/molecules/SearchBar";
import Modal from "@/components/molecules/Modal";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import studentService from "@/services/api/studentService";
import gradeService from "@/services/api/gradeService";
import { format } from "date-fns";

const Grades = () => {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    subject: "",
    marks: "",
    maxMarks: "100",
    term: "Term 1",
    date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});

  const subjects = [
    "Mathematics", "English", "Science", "Social Studies", "History",
    "Geography", "Physics", "Chemistry", "Biology", "Computer Science",
    "Art", "Music", "Physical Education", "Languages"
  ];

  const terms = ["Term 1", "Term 2", "Term 3", "Final"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentGrades(selectedStudent);
    } else {
      setGrades([]);
    }
  }, [selectedStudent]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const studentsData = await studentService.getAll();
      setStudents(studentsData);
    } catch (err) {
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentGrades = async (studentId) => {
    try {
      const gradesData = await gradeService.getByStudentId(studentId);
      setGrades(gradesData);
    } catch (error) {
      toast.error("Failed to load grades");
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
const fullName = `${student.firstName_c || student.firstName || ''} ${student.lastName_c || student.lastName || ''}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) ||
             (student.studentId_c || student.studentId || '').toLowerCase().includes(search) ||
             (student.grade_c || student.grade || '').toLowerCase().includes(search);
    });

    setFilteredStudents(filtered);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId);
    setGradeForm(prev => ({ ...prev, studentId }));
  };

  const handleAddGrade = () => {
    if (!selectedStudent) {
      toast.error("Please select a student first");
      return;
    }
    
    setEditingGrade(null);
    setGradeForm({
      studentId: selectedStudent,
      subject: "",
      marks: "",
      maxMarks: "100",
      term: "Term 1",
      date: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setShowGradeModal(true);
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
setGradeForm({
      studentId_c: grade.studentId_c?.Id || grade.studentId_c || grade.studentId,
      subject_c: grade.subject_c || grade.subject,
      marks_c: (grade.marks_c || grade.marks).toString(),
      maxMarks_c: (grade.maxMarks_c || grade.maxMarks).toString(),
      term_c: grade.term_c || grade.term,
      date_c: (grade.date_c || grade.date).split('T')[0]
    });
    setFormErrors({});
    setShowGradeModal(true);
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm("Are you sure you want to delete this grade?")) return;

    try {
await gradeService.delete(gradeId);
      setGrades(prev => prev.filter(g => g.id !== gradeId));
      toast.success("Grade deleted successfully");
    } catch (error) {
      toast.error("Failed to delete grade");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setGradeForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
if (!gradeForm.subject_c.trim()) errors.subject_c = "Subject is required";
    if (!gradeForm.marks_c.trim()) errors.marks_c = "Marks are required";
    if (isNaN(gradeForm.marks_c) || gradeForm.marks_c < 0) errors.marks_c = "Enter valid marks";
    if (!gradeForm.maxMarks_c.trim()) errors.maxMarks_c = "Max marks are required";
    if (isNaN(gradeForm.maxMarks_c) || gradeForm.maxMarks_c <= 0) errors.maxMarks_c = "Enter valid max marks";
    if (parseFloat(gradeForm.marks_c) > parseFloat(gradeForm.maxMarks_c)) {
      errors.marks_c = "Marks cannot exceed max marks";
    }
    if (!gradeForm.date) errors.date = "Date is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateGradeData = (marks, maxMarks) => {
    const percentage = Math.round((marks / maxMarks) * 100);
    let gradeLetter = "F";
    
    if (percentage >= 90) gradeLetter = "A+";
    else if (percentage >= 85) gradeLetter = "A";
    else if (percentage >= 80) gradeLetter = "B+";
    else if (percentage >= 75) gradeLetter = "B";
    else if (percentage >= 70) gradeLetter = "C+";
    else if (percentage >= 65) gradeLetter = "C";
    else if (percentage >= 60) gradeLetter = "D";
    
    return { percentage, gradeLetter };
  };

  const handleSaveGrade = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      const marks = parseFloat(gradeForm.marks);
      const maxMarks = parseFloat(gradeForm.maxMarks);
      const { percentage, gradeLetter } = calculateGradeData(marks, maxMarks);

const gradeData = {
        studentId_c: gradeForm.studentId_c,
        subject_c: gradeForm.subject_c,
        marks_c: marks,
        maxMarks_c: maxMarks,
        percentage_c: percentage,
        gradeLetter_c: gradeLetter,
        term_c: gradeForm.term_c,
        date_c: gradeForm.date_c
      };

if (editingGrade) {
        await gradeService.update(editingGrade.Id || editingGrade.id, gradeData);
        toast.success("Grade updated successfully");
      } else {
        await gradeService.create(gradeData);
        toast.success("Grade added successfully");
      }

      setShowGradeModal(false);
      loadStudentGrades(selectedStudent);
    } catch (error) {
      toast.error("Failed to save grade");
    }
  };

  const getGradeVariant = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "error";
  };

  const calculateStudentStats = () => {
    if (grades.length === 0) return { average: 0, highest: 0, lowest: 0 };
    
const percentages = grades.map(g => g.percentage_c || g.percentage);
    return {
      average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages)
    };
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView onRetry={loadData} />;

const selectedStudentData = students.find(s => (s.Id || s.id) === selectedStudent);
  const stats = selectedStudent ? calculateStudentStats() : { average: 0, highest: 0, lowest: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Grades Management
          </h1>
          <p className="text-gray-600 mt-1">
            Record and track student academic performance
          </p>
        </div>
        <Button 
          onClick={handleAddGrade}
          disabled={!selectedStudent}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
          Add Grade
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
            
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search students..."
              className="mb-4"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <button
key={student.Id || student.id}
                    onClick={() => handleStudentSelect(student.Id || student.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      selectedStudent === (student.Id || student.id)
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {(student.firstName_c || student.firstName)?.charAt(0)}{(student.lastName_c || student.lastName)?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.firstName_c || student.firstName} {student.lastName_c || student.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          ID: {student.studentId_c || student.studentId} • Grade: {student.grade_c || student.grade}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <ApperIcon name="Users" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchTerm ? "No students found" : "No students available"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Grades Display */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
<div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(selectedStudentData?.firstName_c || selectedStudentData?.firstName)?.charAt(0)}{(selectedStudentData?.lastName_c || selectedStudentData?.lastName)?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedStudentData?.firstName_c || selectedStudentData?.firstName} {selectedStudentData?.lastName_c || selectedStudentData?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {selectedStudentData?.studentId_c || selectedStudentData?.studentId} • Grade: {selectedStudentData?.grade_c || selectedStudentData?.grade}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAddGrade}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                  Add Grade
                </Button>
              </div>

              {/* Stats */}
              {grades.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Average Grade</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.average}%</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Highest Grade</p>
                    <p className="text-2xl font-bold text-green-700">{stats.highest}%</p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">Lowest Grade</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.lowest}%</p>
                  </div>
                </div>
              )}

              {/* Grades List */}
              {grades.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Grade Records</h4>
                  {grades.map((grade) => (
<div key={grade.Id || grade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">{grade.subject_c || grade.subject}</p>
                            <p className="text-sm text-gray-600">
                              {grade.term_c || grade.term} • {format(new Date(grade.date_c || grade.date), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {grade.marks_c || grade.marks}/{grade.maxMarks_c || grade.maxMarks}
                            </p>
                            <Badge variant={getGradeVariant(grade.percentage_c || grade.percentage)}>
                              {grade.percentage_c || grade.percentage}% ({grade.gradeLetter_c || grade.gradeLetter})
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGrade(grade)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                        >
                          <ApperIcon name="Edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
onClick={() => handleDeleteGrade(grade.Id || grade.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <ApperIcon name="Trash2" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No Grades Recorded"
                  message="Start by adding the first grade for this student."
                  actionLabel="Add First Grade"
                  action={handleAddGrade}
                  icon="Award"
                />
              )}
            </Card>
          ) : (
            <Empty
              title="Select a Student"
              message="Choose a student from the list to view and manage their grades."
              icon="Award"
            />
          )}
        </div>
      </div>

      {/* Grade Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title={editingGrade ? "Edit Grade" : "Add Grade"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowGradeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade}>
              {editingGrade ? "Update Grade" : "Save Grade"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<Select
              label="Subject"
              name="subject_c"
              value={gradeForm.subject_c}
              onChange={handleFormChange}
              error={formErrors.subject_c}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </Select>

            <Select
              label="Term"
              name="term_c"
              value={gradeForm.term_c}
              onChange={handleFormChange}
              required
            >
              {terms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </Select>

            <Input
              label="Marks Obtained"
              name="marks_c"
              type="number"
              min="0"
              value={gradeForm.marks_c}
              onChange={handleFormChange}
              error={formErrors.marks_c}
              required
            />

            <Input
              label="Maximum Marks"
              name="maxMarks_c"
              type="number"
              min="1"
              value={gradeForm.maxMarks_c}
              onChange={handleFormChange}
              error={formErrors.maxMarks_c}
              required
            />

            <Input
              label="Date"
              name="date_c"
              type="date"
              value={gradeForm.date_c}
              onChange={handleFormChange}
              error={formErrors.date_c}
              required
            />
          </div>

          {/* Grade Preview */}
          {gradeForm.marks && gradeForm.maxMarks && !isNaN(gradeForm.marks) && !isNaN(gradeForm.maxMarks) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Grade Preview</h4>
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-gray-600">Percentage</p>
<p className="text-lg font-bold">
                    {Math.round((parseFloat(gradeForm.marks_c) / parseFloat(gradeForm.maxMarks_c)) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Letter Grade</p>
                  <Badge variant={getGradeVariant(Math.round((parseFloat(gradeForm.marks_c) / parseFloat(gradeForm.maxMarks_c)) * 100))}>
                    {calculateGradeData(parseFloat(gradeForm.marks_c), parseFloat(gradeForm.maxMarks_c)).gradeLetter}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Grades;