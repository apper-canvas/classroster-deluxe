import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import StatCard from "@/components/molecules/StatCard";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import studentService from "@/services/api/studentService";
import gradeService from "@/services/api/gradeService";
import attendanceService from "@/services/api/attendanceService";
import { format, isToday, subDays } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    students: [],
    grades: [],
    attendance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [studentsData, gradesData, attendanceData] = await Promise.all([
        studentService.getAll(),
        gradeService.getAll(),
        attendanceService.getAll()
      ]);
      
      setData({
        students: studentsData,
        grades: gradesData,
        attendance: attendanceData
      });
    } catch (err) {
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalStudents = data.students.length;
    const activeStudents = data.students.filter(s => s.status === "Active").length;
    
    // Calculate average grade
    const averageGrade = data.grades.length > 0 
      ? Math.round(data.grades.reduce((sum, grade) => sum + grade.percentage, 0) / data.grades.length)
      : 0;
    
    // Calculate today's attendance rate
    const todayAttendance = data.attendance.filter(a => isToday(new Date(a.date)));
    const attendanceRate = todayAttendance.length > 0
      ? Math.round((todayAttendance.filter(a => a.status === "Present").length / todayAttendance.length) * 100)
      : 0;

    return {
      totalStudents,
      activeStudents,
      averageGrade,
      attendanceRate
    };
  };

  const getRecentActivity = () => {
    const recentGrades = data.grades
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(grade => {
        const student = data.students.find(s => s.id === grade.studentId);
        return {
          id: grade.id,
          type: "grade",
          message: `${student?.firstName} ${student?.lastName} received ${grade.percentage}% in ${grade.subject}`,
          date: grade.date,
          status: grade.percentage >= 80 ? "success" : grade.percentage >= 60 ? "warning" : "error"
        };
      });

    const recentAttendance = data.attendance
      .filter(a => new Date(a.date) >= subDays(new Date(), 7))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .map(attendance => {
        const student = data.students.find(s => s.id === attendance.studentId);
        return {
          id: attendance.id,
          type: "attendance",
          message: `${student?.firstName} ${student?.lastName} was ${attendance.status.toLowerCase()} on ${format(new Date(attendance.date), "MMM dd")}`,
          date: attendance.date,
          status: attendance.status === "Present" ? "success" : "error"
        };
      });

    return [...recentGrades, ...recentAttendance]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  };

  const getQuickActions = () => [
    {
      title: "Add Student",
      description: "Register a new student",
      icon: "UserPlus",
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/students?action=add")
    },
    {
      title: "Record Grades",
      description: "Enter student grades",
      icon: "Award",
      color: "from-green-500 to-green-600",
      action: () => navigate("/grades")
    },
    {
      title: "Mark Attendance",
      description: "Take today's attendance",
      icon: "Calendar",
      color: "from-purple-500 to-purple-600",
      action: () => navigate("/attendance")
    },
    {
      title: "View Reports",
      description: "Generate student reports",
      icon: "FileText",
      color: "from-orange-500 to-orange-600",
      action: () => toast.info("Reports feature coming soon!")
    }
  ];

  if (loading) return <Loading />;
  if (error) return <ErrorView onRetry={loadDashboardData} />;

  if (data.students.length === 0) {
    return (
      <Empty
        title="Welcome to ClassRoster"
        message="Get started by adding your first student to begin managing your classroom."
        actionLabel="Add Your First Student"
        action={() => navigate("/students?action=add")}
        icon="GraduationCap"
      />
    );
  }

  const stats = calculateStats();
  const recentActivity = getRecentActivity();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening in your classroom today.
          </p>
        </div>
        <Button 
          onClick={() => navigate("/students?action=add")}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon="Users"
          variant="default"
          trend="up"
          trendValue={`${stats.activeStudents} active`}
        />
        <StatCard
          title="Average Grade"
          value={`${stats.averageGrade}%`}
          icon="Award"
          variant={stats.averageGrade >= 80 ? "success" : stats.averageGrade >= 60 ? "warning" : "danger"}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon="Calendar"
          variant={stats.attendanceRate >= 90 ? "success" : stats.attendanceRate >= 75 ? "warning" : "danger"}
        />
        <StatCard
          title="Classes Today"
          value="6"
          icon="Clock"
          variant="default"
          trend="up"
          trendValue="2 completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === "grade" ? "bg-blue-100" : "bg-green-100"
                    }`}>
                      <ApperIcon 
                        name={activity.type === "grade" ? "Award" : "Calendar"} 
                        className={`h-4 w-4 ${
                          activity.type === "grade" ? "text-blue-600" : "text-green-600"
                        }`} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(activity.date), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Badge variant={activity.status} size="sm">
                      {activity.status === "success" ? "✓" : activity.status === "warning" ? "!" : "×"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ApperIcon name="Activity" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="space-y-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                      <ApperIcon name={action.icon} className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-primary-700">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Today's Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Classes Scheduled</span>
                <span className="text-sm font-medium text-gray-900">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Students Present</span>
                <span className="text-sm font-medium text-green-600">{stats.attendanceRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Assignments Due</span>
                <span className="text-sm font-medium text-orange-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Grades Pending</span>
                <span className="text-sm font-medium text-red-600">8</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;