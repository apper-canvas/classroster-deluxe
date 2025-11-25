import apper from 'https://cdn.apper.io/actions/apper-actions.js';

apper.serve(async (req) => {
  try {
    // Parse request body
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

    const { action, userId, studentId, studentIds, userRole } = requestData;

    // Validate required fields
    if (!action || !userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: action and userId are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Define access policies based on user roles
    const accessPolicies = {
      admin: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: true,
        canCreateAll: true
      },
      teacher: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: true,
        canViewAssigned: true,
        canEditAssigned: true
      },
      student: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewOwn: true,
        canEditOwn: false
      }
    };

    const userPolicy = accessPolicies[userRole] || accessPolicies.student;

    // Process different actions
    switch (action) {
      case 'canView':
        const viewResult = await processViewAccess(userPolicy, userId, studentId, studentIds, userRole);
        return new Response(JSON.stringify(viewResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canEdit':
        const editResult = await processEditAccess(userPolicy, userId, studentId, userRole);
        return new Response(JSON.stringify(editResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canDelete':
        const deleteResult = await processDeleteAccess(userPolicy, userId, studentId, userRole);
        return new Response(JSON.stringify(deleteResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canCreate':
        const createResult = await processCreateAccess(userPolicy, userId, userRole);
        return new Response(JSON.stringify(createResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'filterStudents':
        const filterResult = await filterStudentsByAccess(userPolicy, userId, studentIds || [], userRole);
        return new Response(JSON.stringify(filterResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action specified',
          validActions: ['canView', 'canEdit', 'canDelete', 'canCreate', 'filterStudents']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error processing student access policy',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function processViewAccess(policy, userId, studentId, studentIds, userRole) {
  try {
    // Admin can view all
    if (policy.canViewAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full access'
      };
    }

    // Student can only view their own record
    if (userRole === 'student') {
      if (studentId && studentId !== userId) {
        return {
          success: true,
          allowed: false,
          reason: 'Students can only view their own records'
        };
      }
      return {
        success: true,
        allowed: true,
        reason: 'Student viewing own record'
      };
    }

    // Teacher can view assigned students
    if (userRole === 'teacher' && policy.canViewAssigned) {
      if (studentId) {
        const isAssigned = await checkTeacherStudentAssignment(userId, studentId);
        return {
          success: true,
          allowed: isAssigned,
          reason: isAssigned ? 'Teacher viewing assigned student' : 'Student not assigned to this teacher'
        };
      }

      // For multiple students, filter by assignment
      if (studentIds && studentIds.length > 0) {
        const assignedStudents = await getAssignedStudents(userId);
        const allowedIds = studentIds.filter(id => assignedStudents.includes(id));
        return {
          success: true,
          allowed: true,
          filteredIds: allowedIds,
          reason: `Teacher can view ${allowedIds.length} of ${studentIds.length} requested students`
        };
      }
    }

    return {
      success: true,
      allowed: false,
      reason: 'Access denied by policy'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing view access',
      details: error.message
    };
  }
}

async function processEditAccess(policy, userId, studentId, userRole) {
  try {
    if (policy.canEditAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full edit access'
      };
    }

    if (userRole === 'teacher' && policy.canEditAssigned) {
      if (!studentId) {
        return {
          success: true,
          allowed: false,
          reason: 'Student ID required for edit access check'
        };
      }

      const isAssigned = await checkTeacherStudentAssignment(userId, studentId);
      return {
        success: true,
        allowed: isAssigned,
        reason: isAssigned ? 'Teacher can edit assigned student' : 'Cannot edit unassigned student'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Edit access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing edit access',
      details: error.message
    };
  }
}

async function processDeleteAccess(policy, userId, studentId, userRole) {
  try {
    if (policy.canDeleteAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has delete access'
      };
    }

    // Generally, only admins can delete student records
    return {
      success: true,
      allowed: false,
      reason: 'Delete access restricted to administrators'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing delete access',
      details: error.message
    };
  }
}

async function processCreateAccess(policy, userId, userRole) {
  try {
    if (policy.canCreateAll) {
      return {
        success: true,
        allowed: true,
        reason: userRole === 'admin' ? 'Admin can create students' : 'Teacher can create students'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Create access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing create access',
      details: error.message
    };
  }
}

async function filterStudentsByAccess(policy, userId, studentIds, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        filteredIds: studentIds,
        reason: 'Admin can view all students'
      };
    }

    if (userRole === 'teacher' && policy.canViewAssigned) {
      const assignedStudents = await getAssignedStudents(userId);
      const filteredIds = studentIds.filter(id => assignedStudents.includes(id));
      return {
        success: true,
        filteredIds: filteredIds,
        reason: `Filtered to ${filteredIds.length} assigned students`
      };
    }

    if (userRole === 'student') {
      const filteredIds = studentIds.filter(id => id === userId);
      return {
        success: true,
        filteredIds: filteredIds,
        reason: 'Student can only view own record'
      };
    }

    return {
      success: true,
      filteredIds: [],
      reason: 'No access to requested students'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error filtering students by access',
      details: error.message
    };
  }
}

// Mock function to check teacher-student assignment
// In a real implementation, this would query your database
async function checkTeacherStudentAssignment(teacherId, studentId) {
  try {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock logic: assume teachers are assigned to students based on some criteria
    // This would be replaced with actual database query
    const teacherAssignments = {
      'teacher1': ['student1', 'student2', 'student3'],
      'teacher2': ['student4', 'student5', 'student6']
    };

    return teacherAssignments[teacherId]?.includes(studentId) || false;
  } catch (error) {
    console.error('Error checking teacher-student assignment:', error);
    return false;
  }
}

// Mock function to get assigned students for a teacher
async function getAssignedStudents(teacherId) {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const teacherAssignments = {
      'teacher1': ['student1', 'student2', 'student3'],
      'teacher2': ['student4', 'student5', 'student6']
    };

    return teacherAssignments[teacherId] || [];
  } catch (error) {
    console.error('Error getting assigned students:', error);
    return [];
  }
}