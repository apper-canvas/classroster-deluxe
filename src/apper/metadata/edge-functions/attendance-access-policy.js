import apper from 'https://cdn.apper.io/actions/apper-actions.js';

apper.serve(async (req) => {
  try {
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { 
      action, 
      userId, 
      attendanceId, 
      attendanceIds, 
      studentId, 
      classId, 
      userRole,
      dateRange,
      academicPeriod 
    } = requestData;

    if (!action || !userId || !userRole) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: action, userId, and userRole are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Define attendance access policies
    const accessPolicies = {
      admin: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: true,
        canCreateAll: true,
        canViewReports: true,
        canExportAttendance: true,
        canBulkEdit: true
      },
      teacher: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewOwn: true,
        canEditOwn: true,
        canDeleteOwn: true,
        canCreateOwn: true,
        canViewClassAttendance: true,
        canEditClassAttendance: true,
        canMarkAttendance: true,
        canViewAttendanceReports: true,
        canExportClassAttendance: true,
        canBulkMarkAttendance: true
      },
      student: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewOwn: true,
        canViewOwnHistory: true,
        canViewOwnReports: true
      },
      parent: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewChildAttendance: true,
        canViewChildHistory: true,
        canViewChildReports: true
      }
    };

    const userPolicy = accessPolicies[userRole] || accessPolicies.student;

    switch (action) {
      case 'canViewAttendance':
        const viewResult = await processViewAttendanceAccess(userPolicy, userId, attendanceId, studentId, classId, userRole);
        return new Response(JSON.stringify(viewResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canMarkAttendance':
        const markResult = await processMarkAttendanceAccess(userPolicy, userId, studentId, classId, userRole);
        return new Response(JSON.stringify(markResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canEditAttendance':
        const editResult = await processEditAttendanceAccess(userPolicy, userId, attendanceId, studentId, classId, userRole);
        return new Response(JSON.stringify(editResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canDeleteAttendance':
        const deleteResult = await processDeleteAttendanceAccess(userPolicy, userId, attendanceId, userRole);
        return new Response(JSON.stringify(deleteResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'filterAttendance':
        const filterResult = await filterAttendanceByAccess(userPolicy, userId, attendanceIds || [], userRole);
        return new Response(JSON.stringify(filterResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'getStudentAttendance':
        const studentAttendanceResult = await getStudentAttendanceAccess(userPolicy, userId, studentId, dateRange, userRole);
        return new Response(JSON.stringify(studentAttendanceResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'getClassAttendance':
        const classAttendanceResult = await getClassAttendanceAccess(userPolicy, userId, classId, dateRange, userRole);
        return new Response(JSON.stringify(classAttendanceResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canBulkMarkAttendance':
        const bulkMarkResult = await processBulkMarkAttendanceAccess(userPolicy, userId, classId, userRole);
        return new Response(JSON.stringify(bulkMarkResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canExportAttendance':
        const exportResult = await processExportAttendanceAccess(userPolicy, userId, classId, studentId, dateRange, userRole);
        return new Response(JSON.stringify(exportResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action specified',
          validActions: [
            'canViewAttendance', 'canMarkAttendance', 'canEditAttendance', 'canDeleteAttendance',
            'filterAttendance', 'getStudentAttendance', 'getClassAttendance', 
            'canBulkMarkAttendance', 'canExportAttendance'
          ]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error processing attendance access policy',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function processViewAttendanceAccess(policy, userId, attendanceId, studentId, classId, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full view access'
      };
    }

    const attendance = attendanceId ? await getAttendanceDetails(attendanceId) : null;
    const targetStudentId = studentId || attendance?.studentId;
    const targetClassId = classId || attendance?.classId;

    // Teacher can view attendance for their classes and students
    if (userRole === 'teacher' && policy.canViewClassAttendance) {
      let hasClassAccess = false;
      let hasStudentAccess = false;
      
      if (targetClassId) {
        hasClassAccess = await canTeacherAccessClass(userId, targetClassId);
      }
      
      if (targetStudentId) {
        hasStudentAccess = await canTeacherViewStudentAttendance(userId, targetStudentId);
      }
      
      const allowed = hasClassAccess || hasStudentAccess;
      return {
        success: true,
        allowed,
        reason: hasClassAccess ? 'Teacher can view class attendance' :
                hasStudentAccess ? 'Teacher can view student attendance' : 'No access to attendance records'
      };
    }

    // Student can view their own attendance
    if (userRole === 'student' && policy.canViewOwn) {
      return {
        success: true,
        allowed: targetStudentId === userId,
        reason: targetStudentId === userId ? 'Student viewing own attendance' : 'Cannot view other student attendance'
      };
    }

    // Parent can view their child's attendance
    if (userRole === 'parent' && policy.canViewChildAttendance) {
      if (!targetStudentId) {
        return {
          success: true,
          allowed: false,
          reason: 'Student ID required for parent access'
        };
      }
      
      const isParentChild = await isStudentParentChild(userId, targetStudentId);
      return {
        success: true,
        allowed: isParentChild,
        reason: isParentChild ? 'Parent viewing child attendance' : 'Not authorized to view this student attendance'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Attendance view access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing view attendance access',
      details: error.message
    };
  }
}

async function processMarkAttendanceAccess(policy, userId, studentId, classId, userRole) {
  try {
    if (policy.canCreateAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can mark attendance for all'
      };
    }

    if (!studentId || !classId) {
      return {
        success: true,
        allowed: false,
        reason: 'Student ID and Class ID are required for marking attendance'
      };
    }

    // Only teachers can mark attendance
    if (userRole === 'teacher' && policy.canMarkAttendance) {
      const hasClassAccess = await canTeacherAccessClass(userId, classId);
      const hasStudentAccess = await canTeacherViewStudentAttendance(userId, studentId);
      const canMarkToday = await canMarkAttendanceForDate(classId, new Date());
      
      return {
        success: true,
        allowed: hasClassAccess && hasStudentAccess && canMarkToday,
        reason: !hasClassAccess ? 'No access to this class' :
                !hasStudentAccess ? 'Student not in teacher class' :
                !canMarkToday ? 'Attendance already marked or outside marking window' : 'Teacher can mark attendance'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Attendance marking access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing mark attendance access',
      details: error.message
    };
  }
}

async function processEditAttendanceAccess(policy, userId, attendanceId, studentId, classId, userRole) {
  try {
    if (policy.canEditAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full edit access'
      };
    }

    const attendance = attendanceId ? await getAttendanceDetails(attendanceId) : null;
    const targetStudentId = studentId || attendance?.studentId;
    const targetClassId = classId || attendance?.classId;

    if (!targetStudentId || !targetClassId) {
      return {
        success: true,
        allowed: false,
        reason: 'Student ID and Class ID are required for editing attendance'
      };
    }

    // Teachers can edit attendance within certain timeframes
    if (userRole === 'teacher' && policy.canEditClassAttendance) {
      const hasClassAccess = await canTeacherAccessClass(userId, targetClassId);
      const hasStudentAccess = await canTeacherViewStudentAttendance(userId, targetStudentId);
      const isEditable = attendance ? await isAttendanceEditable(attendanceId) : true;
      
      return {
        success: true,
        allowed: hasClassAccess && hasStudentAccess && isEditable,
        reason: !hasClassAccess ? 'No access to this class' :
                !hasStudentAccess ? 'Student not in teacher class' :
                !isEditable ? 'Attendance record is locked (too old or finalized)' : 'Teacher can edit attendance'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Attendance edit access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing edit attendance access',
      details: error.message
    };
  }
}

async function processDeleteAttendanceAccess(policy, userId, attendanceId, userRole) {
  try {
    if (policy.canDeleteAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has delete access'
      };
    }

    if (!attendanceId) {
      return {
        success: true,
        allowed: false,
        reason: 'Attendance ID is required'
      };
    }

    const attendance = await getAttendanceDetails(attendanceId);
    
    if (!attendance) {
      return {
        success: true,
        allowed: false,
        reason: 'Attendance record not found'
      };
    }

    // Teachers can delete attendance records within certain conditions
    if (userRole === 'teacher' && policy.canDeleteOwn) {
      const hasClassAccess = await canTeacherAccessClass(userId, attendance.classId);
      const hasStudentAccess = await canTeacherViewStudentAttendance(userId, attendance.studentId);
      const isDeletable = await isAttendanceDeletable(attendanceId);
      
      return {
        success: true,
        allowed: hasClassAccess && hasStudentAccess && isDeletable,
        reason: !hasClassAccess ? 'No access to this class' :
                !hasStudentAccess ? 'Student not in teacher class' :
                !isDeletable ? 'Attendance record cannot be deleted (finalized or too old)' : 'Teacher can delete attendance'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Attendance delete access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing delete attendance access',
      details: error.message
    };
  }
}

async function filterAttendanceByAccess(policy, userId, attendanceIds, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        filteredIds: attendanceIds,
        reason: 'Admin can view all attendance records'
      };
    }

    const accessibleAttendance = [];
    
    for (const attendanceId of attendanceIds) {
      const attendance = await getAttendanceDetails(attendanceId);
      
      if (attendance) {
        let hasAccess = false;
        
        if (userRole === 'teacher') {
          const hasClassAccess = await canTeacherAccessClass(userId, attendance.classId);
          const hasStudentAccess = await canTeacherViewStudentAttendance(userId, attendance.studentId);
          hasAccess = hasClassAccess || hasStudentAccess;
        } else if (userRole === 'student') {
          hasAccess = attendance.studentId === userId;
        } else if (userRole === 'parent') {
          hasAccess = await isStudentParentChild(userId, attendance.studentId);
        }
        
        if (hasAccess) {
          accessibleAttendance.push(attendanceId);
        }
      }
    }

    return {
      success: true,
      filteredIds: accessibleAttendance,
      reason: `Filtered to ${accessibleAttendance.length} accessible attendance records`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error filtering attendance by access',
      details: error.message
    };
  }
}

async function getStudentAttendanceAccess(policy, userId, studentId, dateRange, userRole) {
  try {
    if (!studentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Student ID is required'
      };
    }

    if (policy.canViewAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can view all student attendance'
      };
    }

    // Teacher can view attendance for their students
    if (userRole === 'teacher' && policy.canViewClassAttendance) {
      const hasStudentAccess = await canTeacherViewStudentAttendance(userId, studentId);
      return {
        success: true,
        allowed: hasStudentAccess,
        reason: hasStudentAccess ? 'Teacher can view student attendance' : 'Student not in teacher classes'
      };
    }

    // Student can view their own attendance history
    if (userRole === 'student' && policy.canViewOwnHistory) {
      return {
        success: true,
        allowed: studentId === userId,
        reason: studentId === userId ? 'Student viewing own attendance history' : 'Cannot view other student attendance'
      };
    }

    // Parent can view their child's attendance
    if (userRole === 'parent' && policy.canViewChildHistory) {
      const isParentChild = await isStudentParentChild(userId, studentId);
      return {
        success: true,
        allowed: isParentChild,
        reason: isParentChild ? 'Parent viewing child attendance history' : 'Not authorized to view this student attendance'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Student attendance access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing student attendance access',
      details: error.message
    };
  }
}

async function getClassAttendanceAccess(policy, userId, classId, dateRange, userRole) {
  try {
    if (!classId) {
      return {
        success: true,
        allowed: false,
        reason: 'Class ID is required'
      };
    }

    if (policy.canViewAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can view all class attendance'
      };
    }

    // Teacher can view attendance for their classes
    if (userRole === 'teacher' && policy.canViewAttendanceReports) {
      const hasClassAccess = await canTeacherAccessClass(userId, classId);
      return {
        success: true,
        allowed: hasClassAccess,
        reason: hasClassAccess ? 'Teacher can view class attendance' : 'No access to this class'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Class attendance access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing class attendance access',
      details: error.message
    };
  }
}

async function processBulkMarkAttendanceAccess(policy, userId, classId, userRole) {
  try {
    if (policy.canBulkEdit) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can bulk mark attendance'
      };
    }

    if (!classId) {
      return {
        success: true,
        allowed: false,
        reason: 'Class ID is required for bulk attendance marking'
      };
    }

    // Teachers can bulk mark attendance for their classes
    if (userRole === 'teacher' && policy.canBulkMarkAttendance) {
      const hasClassAccess = await canTeacherAccessClass(userId, classId);
      const canBulkMark = await canBulkMarkAttendanceForClass(classId, new Date());
      
      return {
        success: true,
        allowed: hasClassAccess && canBulkMark,
        reason: !hasClassAccess ? 'No access to this class' :
                !canBulkMark ? 'Bulk attendance already marked or outside marking window' : 'Teacher can bulk mark attendance'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Bulk attendance marking access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing bulk mark attendance access',
      details: error.message
    };
  }
}

async function processExportAttendanceAccess(policy, userId, classId, studentId, dateRange, userRole) {
  try {
    if (policy.canExportAttendance) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can export all attendance'
      };
    }

    // Teacher can export attendance for their classes/students
    if (userRole === 'teacher' && policy.canExportClassAttendance) {
      if (classId) {
        const hasClassAccess = await canTeacherAccessClass(userId, classId);
        return {
          success: true,
          allowed: hasClassAccess,
          reason: hasClassAccess ? 'Teacher can export class attendance' : 'No access to this class'
        };
      } else if (studentId) {
        const hasStudentAccess = await canTeacherViewStudentAttendance(userId, studentId);
        return {
          success: true,
          allowed: hasStudentAccess,
          reason: hasStudentAccess ? 'Teacher can export student attendance' : 'Student not in teacher classes'
        };
      }
    }

    return {
      success: true,
      allowed: false,
      reason: 'Attendance export access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing export attendance access',
      details: error.message
    };
  }
}

// Mock database functions - replace with actual database queries
async function getAttendanceDetails(attendanceId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const mockAttendance = {
    'att1': { id: 'att1', studentId: 'student1', classId: 'class1', teacherId: 'teacher1', date: '2024-01-15', status: 'present' },
    'att2': { id: 'att2', studentId: 'student2', classId: 'class1', teacherId: 'teacher1', date: '2024-01-15', status: 'absent' },
    'att3': { id: 'att3', studentId: 'student3', classId: 'class2', teacherId: 'teacher2', date: '2024-01-15', status: 'late' }
  };
  
  return mockAttendance[attendanceId] || null;
}

async function canTeacherAccessClass(teacherId, classId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const teacherClasses = {
    'teacher1': ['class1', 'class2'],
    'teacher2': ['class3', 'class4']
  };
  
  return teacherClasses[teacherId]?.includes(classId) || false;
}

async function canTeacherViewStudentAttendance(teacherId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const teacherStudents = {
    'teacher1': ['student1', 'student2'],
    'teacher2': ['student3', 'student4']
  };
  
  return teacherStudents[teacherId]?.includes(studentId) || false;
}

async function isStudentParentChild(parentId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const parentChildren = {
    'parent1': ['student1', 'student2'],
    'parent2': ['student3']
  };
  
  return parentChildren[parentId]?.includes(studentId) || false;
}

async function canMarkAttendanceForDate(classId, date) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mock logic: can only mark attendance for today and within school hours
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const currentHour = today.getHours();
  const isDuringSchoolHours = currentHour >= 7 && currentHour <= 18; // 7 AM to 6 PM
  
  return isToday && isDuringSchoolHours;
}

async function isAttendanceEditable(attendanceId) {
  const attendance = await getAttendanceDetails(attendanceId);
  
  if (!attendance) return false;
  
  // Can edit attendance for up to 24 hours after the recorded date
  const attendanceDate = new Date(attendance.date);
  const now = new Date();
  const hoursDiff = (now - attendanceDate) / (1000 * 60 * 60);
  
  return hoursDiff <= 24;
}

async function isAttendanceDeletable(attendanceId) {
  const attendance = await getAttendanceDetails(attendanceId);
  
  if (!attendance) return false;
  
  // Can delete attendance for up to 7 days and if not finalized
  const attendanceDate = new Date(attendance.date);
  const now = new Date();
  const daysDiff = (now - attendanceDate) / (1000 * 60 * 60 * 24);
  
  return daysDiff <= 7 && attendance.status !== 'finalized';
}

async function canBulkMarkAttendanceForClass(classId, date) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mock logic: can bulk mark attendance once per day per class
  const hasAlreadyMarked = await checkBulkAttendanceMarked(classId, date);
  const canMarkToday = await canMarkAttendanceForDate(classId, date);
  
  return !hasAlreadyMarked && canMarkToday;
}

async function checkBulkAttendanceMarked(classId, date) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mock check - assume attendance not yet marked for simplicity
  return false;
}