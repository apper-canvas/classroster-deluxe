import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import SearchBar from '@/components/molecules/SearchBar';
import Modal from '@/components/molecules/Modal';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import Empty from '@/components/ui/Empty';
import ApperIcon from '@/components/ApperIcon';
import assignmentService from '@/services/api/assignmentService';
import studentService from '@/services/api/studentService';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [studentFilter, setStudentFilter] = useState(searchParams.get('student') || 'all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    Name: '',
    title_c: '',
    student_c: '',
    dueDate_c: '',
    description_c: '',
    status_c: 'Assigned',
    grade_c: '',
    assignmentType_c: 'Homework',
    notes_c: ''
  });

  const statusOptions = [
    { value: 'Assigned', label: 'Assigned', variant: 'default' },
    { value: 'In Progress', label: 'In Progress', variant: 'warning' },
    { value: 'Completed', label: 'Completed', variant: 'success' },
    { value: 'Submitted', label: 'Submitted', variant: 'info' },
    { value: 'Graded', label: 'Graded', variant: 'success' }
  ];

  const typeOptions = [
    { value: 'Homework', label: 'Homework' },
    { value: 'Quiz', label: 'Quiz' },
    { value: 'Test', label: 'Test' },
    { value: 'Project', label: 'Project' },
    { value: 'Presentation', label: 'Presentation' },
    { value: 'Lab', label: 'Lab' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (studentFilter !== 'all') params.set('student', studentFilter);
    setSearchParams(params);
  }, [searchTerm, statusFilter, typeFilter, studentFilter]);

  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      const [assignmentsData, studentsData] = await Promise.all([
        assignmentService.getAll(),
        studentService.getAll()
      ]);
      
      setAssignments(assignmentsData || []);
      setStudents(studentsData || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading assignments data:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterAssignments() {
    return assignments.filter(assignment => {
      const matchesSearch = !searchTerm || 
        assignment.title_c?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.student_c?.Name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || assignment.status_c === statusFilter;
      const matchesType = typeFilter === 'all' || assignment.assignmentType_c === typeFilter;
      const matchesStudent = studentFilter === 'all' || assignment.student_c?.Id == studentFilter;
      
      return matchesSearch && matchesStatus && matchesType && matchesStudent;
    });
  }

  function handleSearch(term) {
    setSearchTerm(term);
  }

  function handleAddAssignment() {
    setModalMode('create');
    setSelectedAssignment(null);
    setFormData({
      Name: '',
      title_c: '',
      student_c: '',
      dueDate_c: '',
      description_c: '',
      status_c: 'Assigned',
      grade_c: '',
      assignmentType_c: 'Homework',
      notes_c: ''
    });
    setIsModalOpen(true);
  }

  function handleEditAssignment(assignment) {
    setModalMode('edit');
    setSelectedAssignment(assignment);
    setFormData({
      Name: assignment.Name || '',
      title_c: assignment.title_c || '',
      student_c: assignment.student_c?.Id || '',
      dueDate_c: assignment.dueDate_c || '',
      description_c: assignment.description_c || '',
      status_c: assignment.status_c || 'Assigned',
      grade_c: assignment.grade_c || '',
      assignmentType_c: assignment.assignmentType_c || 'Homework',
      notes_c: assignment.notes_c || ''
    });
    setIsModalOpen(true);
  }

  function handleDeleteAssignment(assignment) {
    setAssignmentToDelete(assignment);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (assignmentToDelete) {
      const success = await assignmentService.delete(assignmentToDelete.Id);
      if (success) {
        await loadData();
      }
    }
    setDeleteModalOpen(false);
    setAssignmentToDelete(null);
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setSelectedAssignment(null);
    setFormData({
      Name: '',
      title_c: '',
      student_c: '',
      dueDate_c: '',
      description_c: '',
      status_c: 'Assigned',
      grade_c: '',
      assignmentType_c: 'Homework',
      notes_c: ''
    });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function validateForm() {
    if (!formData.title_c.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.student_c) {
      toast.error('Student is required');
      return false;
    }
    if (!formData.dueDate_c) {
      toast.error('Due date is required');
      return false;
    }
    return true;
  }

  async function handleSaveAssignment() {
    if (!validateForm()) return;

    // Set Name to title_c if not provided
    const dataToSave = {
      ...formData,
      Name: formData.Name || formData.title_c
    };

    let success;
    if (modalMode === 'create') {
      success = await assignmentService.create(dataToSave);
    } else {
      success = await assignmentService.update(selectedAssignment.Id, dataToSave);
    }

    if (success) {
      handleModalClose();
      await loadData();
    }
  }

  function getStatusVariant(status) {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.variant || 'default';
  }

  function getDueDateStatus(dueDate) {
    if (!dueDate) return { text: 'No due date', variant: 'default' };
    
    const due = parseISO(dueDate);
    const today = new Date();
    
    if (isBefore(due, today) && !isToday(due)) {
      return { text: 'Overdue', variant: 'error' };
    } else if (isToday(due)) {
      return { text: 'Due today', variant: 'warning' };
    } else {
      return { text: format(due, 'MMM d, yyyy'), variant: 'default' };
    }
  }

  function getStudentName(studentId) {
    const student = students.find(s => s.Id == studentId);
    return student ? `${student.firstName_c} ${student.lastName_c}` : 'Unknown Student';
  }

  if (loading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorView message={error} onRetry={loadData} />;

  const filteredAssignments = filterAssignments();
  const stats = {
    total: assignments.length,
    assigned: assignments.filter(a => a.status_c === 'Assigned').length,
    inProgress: assignments.filter(a => a.status_c === 'In Progress').length,
    completed: assignments.filter(a => a.status_c === 'Completed').length,
    overdue: assignments.filter(a => {
      if (!a.dueDate_c) return false;
      const due = parseISO(a.dueDate_c);
      return isBefore(due, new Date()) && !isToday(due) && 
             !['Completed', 'Submitted', 'Graded'].includes(a.status_c);
    }).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Track and manage student assignments</p>
        </div>
        <Button onClick={handleAddAssignment} className="flex items-center gap-2">
          <ApperIcon name="Plus" size={16} />
          Add Assignment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar 
            placeholder="Search assignments..."
            onSearch={handleSearch}
            defaultValue={searchTerm}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32"
          >
            <option value="all">All Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-32"
          >
            <option value="all">All Types</option>
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="w-40"
          >
            <option value="all">All Students</option>
            {students.map(student => (
              <option key={student.Id} value={student.Id}>
                {student.firstName_c} {student.lastName_c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Empty
          title="No assignments found"
          description="No assignments match your current filters."
          action={
            <Button onClick={handleAddAssignment} variant="outline">
              <ApperIcon name="Plus" size={16} />
              Add Assignment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map(assignment => {
            const dueDateStatus = getDueDateStatus(assignment.dueDate_c);
            
            return (
              <Card key={assignment.Id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {assignment.title_c}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <ApperIcon name="User" size={14} />
                          <span>{assignment.student_c?.Name || 'Unknown Student'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <ApperIcon name="Calendar" size={14} />
                            <span>{dueDateStatus.text}</span>
                          </div>
                          <Badge variant={getStatusVariant(assignment.status_c)}>
                            {assignment.status_c}
                          </Badge>
                          <Badge variant="outline">
                            {assignment.assignmentType_c}
                          </Badge>
                          {assignment.grade_c && (
                            <div className="flex items-center gap-1">
                              <ApperIcon name="Award" size={14} />
                              <span>Grade: {assignment.grade_c}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {assignment.description_c && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {assignment.description_c}
                      </p>
                    )}
                    
                    {assignment.notes_c && (
                      <div className="text-xs text-gray-500">
                        <strong>Notes:</strong> {assignment.notes_c}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <ApperIcon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ApperIcon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalMode === 'create' ? 'Add Assignment' : 'Edit Assignment'}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              name="title_c"
              value={formData.title_c}
              onChange={handleFormChange}
              placeholder="Assignment title"
              required
            />
            <Select
              label="Student"
              name="student_c"
              value={formData.student_c}
              onChange={handleFormChange}
              required
            >
              <option value="">Select student</option>
              {students.map(student => (
                <option key={student.Id} value={student.Id}>
                  {student.firstName_c} {student.lastName_c}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Due Date"
              name="dueDate_c"
              type="date"
              value={formData.dueDate_c}
              onChange={handleFormChange}
              required
            />
            <Select
              label="Status"
              name="status_c"
              value={formData.status_c}
              onChange={handleFormChange}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Type"
              name="assignmentType_c"
              value={formData.assignmentType_c}
              onChange={handleFormChange}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          
          <Input
            label="Grade (optional)"
            name="grade_c"
            value={formData.grade_c}
            onChange={handleFormChange}
            placeholder="e.g., A+, 95%, etc."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description_c"
              value={formData.description_c}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Assignment description..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes_c"
              value={formData.notes_c}
              onChange={handleFormChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAssignment}>
            {modalMode === 'create' ? 'Create Assignment' : 'Update Assignment'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Assignment"
      >
        <div className="text-center py-4">
          <ApperIcon name="AlertTriangle" size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{assignmentToDelete?.title_c}"? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}