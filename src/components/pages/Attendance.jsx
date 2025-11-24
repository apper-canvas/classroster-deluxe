import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endOfWeek, format, isToday, startOfWeek, subDays } from "date-fns";
import studentService from "@/services/api/studentService";
import attendanceService from "@/services/api/attendanceService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import SearchBar from "@/components/molecules/SearchBar";

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAttendanceForDate();
  }, [selectedDate, students]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentsData, attendanceData] = await Promise.all([
        studentService.getAll(),
        attendanceService.getAll()
      ]);
      setStudents(studentsData);
      setAttendance(attendanceData);
    } catch (err) {
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = () => {
    const dateAttendance = attendance.filter(
record => (record.date_c || record.date).split('T')[0] === selectedDate
    );
    
    const attendanceMap = {};
    dateAttendance.forEach(record => {
attendanceMap[record.studentId_c?.Id || record.studentId_c || record.studentId] = {
        status: record.status_c || record.status,
        remarks: record.remarks_c || record.remarks || "",
        id: record.Id || record.id
      };
    });

    // Initialize attendance for students not yet recorded
    students.forEach(student => {
if (!attendanceMap[student.Id || student.id]) {
        attendanceMap[student.id] = {
          status: "Present",
          remarks: "",
          id: null
        };
      }
    });

    setAttendanceData(attendanceMap);
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

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      
      const promises = students.map(async (student) => {
const record = attendanceData[student.Id || student.id];
        if (!record) return;

        const attendanceRecord = {
          studentId_c: student.Id || student.id,
          date_c: selectedDate,
          status_c: record.status,
          remarks_c: record.remarks
        };

        if (record.id) {
          // Update existing record
          return attendanceService.update(record.id, attendanceRecord);
        } else {
          // Create new record
          return attendanceService.create(attendanceRecord);
        }
      });

      await Promise.all(promises);
      
      // Refresh attendance data
      const updatedAttendance = await attendanceService.getAll();
      setAttendance(updatedAttendance);
      
      toast.success("Attendance saved successfully");
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const newAttendanceData = {};
    students.forEach(student => {
      newAttendanceData[student.id] = {
        ...attendanceData[student.id],
        status: "Present"
      };
    });
    setAttendanceData(prev => ({ ...prev, ...newAttendanceData }));
  };

  const markAllAbsent = () => {
    const newAttendanceData = {};
    students.forEach(student => {
      newAttendanceData[student.id] = {
        ...attendanceData[student.id],
        status: "Absent"
      };
    });
    setAttendanceData(prev => ({ ...prev, ...newAttendanceData }));
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = startOfWeek(new Date()).toISOString().split('T')[0];
    const thisWeekEnd = endOfWeek(new Date()).toISOString().split('T')[0];
    
    // Today's stats
const todayRecords = attendance.filter(record => (record.date_c || record.date).split('T')[0] === today);
    const todayPresent = todayRecords.filter(record => (record.status_c || record.status) === "Present").length;
    const todayTotal = todayRecords.length;
    const todayRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

    // Weekly stats
    const weekRecords = attendance.filter(record => {
      const recordDate = (record.date_c || record.date).split('T')[0];
      return recordDate >= thisWeekStart && recordDate <= thisWeekEnd;
    });
const weekPresent = weekRecords.filter(record => (record.status_c || record.status) === "Present").length;
    const weekTotal = weekRecords.length;
    const weekRate = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;

// Selected date stats
    const selectedRecords = attendance.filter(record => (record.date_c || record.date).split('T')[0] === selectedDate);
    const selectedPresent = selectedRecords.filter(record => (record.status_c || record.status) === "Present").length;
    const selectedTotal = selectedRecords.length;
    const selectedRate = selectedTotal > 0 ? Math.round((selectedPresent / selectedTotal) * 100) : 0;
    return {
      today: { present: todayPresent, total: todayTotal, rate: todayRate },
      week: { present: weekPresent, total: weekTotal, rate: weekRate },
      selected: { present: selectedPresent, total: selectedTotal, rate: selectedRate }
    };
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView onRetry={loadData} />;

  if (students.length === 0) {
    return (
      <Empty
        title="No Students Available"
        message="Add students to your class roster before taking attendance."
        actionLabel="Go to Students"
        action={() => window.location.href = "/students"}
        icon="Users"
      />
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track student attendance and monitor patterns
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={markAllPresent}
            size="sm"
          >
            <ApperIcon name="Check" className="w-4 h-4 mr-2" />
            Mark All Present
          </Button>
          <Button
            variant="secondary"
            onClick={markAllAbsent}
            size="sm"
          >
            <ApperIcon name="X" className="w-4 h-4 mr-2" />
            Mark All Absent
          </Button>
          <Button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today.rate}%</p>
              <p className="text-sm text-gray-500">
                {stats.today.present} of {stats.today.total} present
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="Calendar" className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Average</p>
              <p className="text-2xl font-bold text-gray-900">{stats.week.rate}%</p>
              <p className="text-sm text-gray-500">
                {stats.week.present} of {stats.week.total} records
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="TrendingUp" className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Date</p>
              <p className="text-2xl font-bold text-gray-900">{stats.selected.rate}%</p>
              <p className="text-sm text-gray-500">
                {format(new Date(selectedDate), "MMM dd, yyyy")}
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="Users" className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search students..."
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Attendance List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance for {format(new Date(selectedDate), "MMMM dd, yyyy")}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredStudents.length} students
          </p>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student, index) => {
const record = attendanceData[student.Id || student.id] || { status: "Present", remarks: "" };
              
              return (
                <div
                  key={student.Id || student.id}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-150 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Student Info */}
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {(student.firstName_c || student.firstName)?.charAt(0)}{(student.lastName_c || student.lastName)?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.firstName_c || student.firstName} {student.lastName_c || student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: {student.studentId_c || student.studentId} • Grade: {student.grade_c || student.grade}
                        </p>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
onClick={() => handleAttendanceChange(student.Id || student.id, "status", "Present")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          record.status === "Present"
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600"
                        }`}
                      >
                        <ApperIcon name="Check" className="h-4 w-4 mr-1" />
                        Present
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.Id || student.id, "status", "Absent")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          record.status === "Absent"
                            ? "bg-red-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                        }`}
                      >
                        <ApperIcon name="X" className="h-4 w-4 mr-1" />
                        Absent
                      </button>
                    </div>

                    {/* Remarks */}
                    <div className="flex-1 max-w-xs">
                      <input
                        type="text"
                        placeholder="Remarks (optional)"
value={record.remarks}
onChange={(e) => handleAttendanceChange(student.Id || student.id, "remarks", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            title="No Students Found"
            message={searchTerm ? 
              `No students match your search for "${searchTerm}".` :
              "No students available for attendance."
            }
            icon="Search"
          />
        )}
      </Card>
    </div>
  );
};

export default Attendance;