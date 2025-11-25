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

    const { action, userId, assignmentId, assignmentIds, studentId, userRole, classId } = requestData;

    if (!action || !userId || !userRole) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: action, userId, and userRole are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Define assignment access policies
    const accessPolicies = {
      admin: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: true,
        canCreateAll: true,
        canGradeAll: true
      },
      teacher: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: true,
        canViewOwn: true,
        canEditOwn: true,
        canDeleteOwn: true,
        canGradeOwn: true,
        canViewStudentAssignments: true
      },
      student: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewOwn: true,
        canEditOwn: false,
        canSubmitOwn: true
      }
    };

    const userPolicy = accessPolicies[userRole] || accessPolicies.student;

    switch (action) {
      case 'canViewAssignment':
        const viewResult = await processViewAssignmentAccess(userPolicy, userId, assignmentId, userRole);
        return new Response(JSON.stringify(viewResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canEditAssignment':
        const editResult = await processEditAssignmentAccess(userPolicy, userId, assignmentId, userRole);
        return new Response(JSON.stringify(editResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canGradeAssignment':
        const gradeResult = await processGradeAssignmentAccess(userPolicy, userId, assignmentId, studentId, userRole);
        return new Response(JSON.stringify(gradeResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canCreateAssignment':
        const createResult = await processCreateAssignmentAccess(userPolicy, userId, classId, userRole);
        return new Response(JSON.stringify(createResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canDeleteAssignment':
        const deleteResult = await processDeleteAssignmentAccess(userPolicy, userId, assignmentId, userRole);
        return new Response(JSON.stringify(deleteResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'filterAssignments':
        const filterResult = await filterAssignmentsByAccess(userPolicy, userId, assignmentIds || [], userRole);
        return new Response(JSON.stringify(filterResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'getAssignmentsByStudent':
        const studentAssignmentsResult = await getAssignmentsByStudentAccess(userPolicy, userId, studentId, userRole);
        return new Response(JSON.stringify(studentAssignmentsResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action specified',
          validActions: ['canViewAssignment', 'canEditAssignment', 'canGradeAssignment', 'canCreateAssignment', 'canDeleteAssignment', 'filterAssignments', 'getAssignmentsByStudent']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error processing assignment access policy',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function processViewAssignmentAccess(policy, userId, assignmentId, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full view access'
      };
    }

    if (!assignmentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment ID is required'
      };
    }

    const assignment = await getAssignmentDetails(assignmentId);
    
    if (!assignment) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment not found'
      };
    }

    // Teacher can view their own assignments and assignments for their students
    if (userRole === 'teacher') {
      const isTeacherAssignment = await isAssignmentCreatedByTeacher(assignmentId, userId);
      const hasStudentAccess = await canTeacherViewStudentAssignment(userId, assignment.studentId);
      
      return {
        success: true,
        allowed: isTeacherAssignment || hasStudentAccess,
        reason: isTeacherAssignment ? 'Teacher viewing own assignment' : 
                hasStudentAccess ? 'Teacher viewing student assignment' : 'No access to this assignment'
      };
    }

    // Student can view their own assignments
    if (userRole === 'student') {
      const isStudentAssignment = assignment.studentId === userId;
      return {
        success: true,
        allowed: isStudentAssignment,
        reason: isStudentAssignment ? 'Student viewing own assignment' : 'Assignment not assigned to this student'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Access denied by policy'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing view assignment access',
      details: error.message
    };
  }
}

async function processEditAssignmentAccess(policy, userId, assignmentId, userRole) {
  try {
    if (policy.canEditAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full edit access'
      };
    }

    if (!assignmentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment ID is required'
      };
    }

    const assignment = await getAssignmentDetails(assignmentId);
    
    if (!assignment) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment not found'
      };
    }

    // Teacher can edit their own assignments
    if (userRole === 'teacher' && policy.canEditOwn) {
      const isTeacherAssignment = await isAssignmentCreatedByTeacher(assignmentId, userId);
      
      // Check if assignment is still editable (not submitted/graded)
      const isEditable = await isAssignmentEditable(assignmentId);
      
      return {
        success: true,
        allowed: isTeacherAssignment && isEditable,
        reason: !isTeacherAssignment ? 'Not teacher\'s assignment' : 
                !isEditable ? 'Assignment cannot be edited (submitted/graded)' : 'Teacher can edit own assignment'
      };
    }

    // Students cannot edit assignments, only submit them
    return {
      success: true,
      allowed: false,
      reason: 'Edit access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing edit assignment access',
      details: error.message
    };
  }
}

async function processGradeAssignmentAccess(policy, userId, assignmentId, studentId, userRole) {
  try {
    if (policy.canGradeAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full grading access'
      };
    }

    if (!assignmentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment ID is required for grading'
      };
    }

    const assignment = await getAssignmentDetails(assignmentId);
    
    if (!assignment) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment not found'
      };
    }

    // Only teachers can grade assignments
    if (userRole === 'teacher' && policy.canGradeOwn) {
      const isTeacherAssignment = await isAssignmentCreatedByTeacher(assignmentId, userId);
      const hasStudentAccess = studentId ? await canTeacherViewStudentAssignment(userId, studentId) : true;
      
      // Check if assignment is submitted and ready for grading
      const isSubmitted = await isAssignmentSubmitted(assignmentId);
      
      return {
        success: true,
        allowed: isTeacherAssignment && hasStudentAccess && isSubmitted,
        reason: !isTeacherAssignment ? 'Not teacher\'s assignment' :
                !hasStudentAccess ? 'No access to this student' :
                !isSubmitted ? 'Assignment not yet submitted' : 'Teacher can grade assignment'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Grading access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing grade assignment access',
      details: error.message
    };
  }
}

async function processCreateAssignmentAccess(policy, userId, classId, userRole) {
  try {
    if (policy.canCreateAll) {
      return {
        success: true,
        allowed: true,
        reason: userRole === 'admin' ? 'Admin can create assignments' : 'Teacher can create assignments'
      };
    }

    // Verify teacher has access to the specified class
    if (userRole === 'teacher' && classId) {
      const hasClassAccess = await canTeacherAccessClass(userId, classId);
      return {
        success: true,
        allowed: hasClassAccess,
        reason: hasClassAccess ? 'Teacher can create assignments for their class' : 'No access to specified class'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Create assignment access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing create assignment access',
      details: error.message
    };
  }
}

async function processDeleteAssignmentAccess(policy, userId, assignmentId, userRole) {
  try {
    if (policy.canDeleteAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has delete access'
      };
    }

    if (!assignmentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Assignment ID is required'
      };
    }

    // Teachers can delete their own assignments if not submitted/graded
    if (userRole === 'teacher' && policy.canDeleteOwn) {
      const isTeacherAssignment = await isAssignmentCreatedByTeacher(assignmentId, userId);
      const isDeletable = await isAssignmentDeletable(assignmentId);
      
      return {
        success: true,
        allowed: isTeacherAssignment && isDeletable,
        reason: !isTeacherAssignment ? 'Not teacher\'s assignment' :
                !isDeletable ? 'Assignment cannot be deleted (has submissions/grades)' : 'Teacher can delete own assignment'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Delete access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing delete assignment access',
      details: error.message
    };
  }
}

async function filterAssignmentsByAccess(policy, userId, assignmentIds, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        filteredIds: assignmentIds,
        reason: 'Admin can view all assignments'
      };
    }

    const accessibleAssignments = [];
    
    for (const assignmentId of assignmentIds) {
      const assignment = await getAssignmentDetails(assignmentId);
      
      if (assignment) {
        if (userRole === 'teacher') {
          const isTeacherAssignment = await isAssignmentCreatedByTeacher(assignmentId, userId);
          const hasStudentAccess = await canTeacherViewStudentAssignment(userId, assignment.studentId);
          
          if (isTeacherAssignment || hasStudentAccess) {
            accessibleAssignments.push(assignmentId);
          }
        } else if (userRole === 'student' && assignment.studentId === userId) {
          accessibleAssignments.push(assignmentId);
        }
      }
    }

    return {
      success: true,
      filteredIds: accessibleAssignments,
      reason: `Filtered to ${accessibleAssignments.length} accessible assignments`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error filtering assignments by access',
      details: error.message
    };
  }
}

async function getAssignmentsByStudentAccess(policy, userId, studentId, userRole) {
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
        reason: 'Admin can view all student assignments'
      };
    }

    // Teacher can view assignments for their students
    if (userRole === 'teacher') {
      const hasStudentAccess = await canTeacherViewStudentAssignment(userId, studentId);
      return {
        success: true,
        allowed: hasStudentAccess,
        reason: hasStudentAccess ? 'Teacher can view student assignments' : 'Student not assigned to this teacher'
      };
    }

    // Student can view their own assignments
    if (userRole === 'student') {
      return {
        success: true,
        allowed: studentId === userId,
        reason: studentId === userId ? 'Student viewing own assignments' : 'Cannot view other student assignments'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing student assignments access',
      details: error.message
    };
  }
}

// Mock database functions - replace with actual database queries
async function getAssignmentDetails(assignmentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const mockAssignments = {
    'assign1': { id: 'assign1', teacherId: 'teacher1', studentId: 'student1', status: 'assigned' },
    'assign2': { id: 'assign2', teacherId: 'teacher1', studentId: 'student2', status: 'submitted' },
    'assign3': { id: 'assign3', teacherId: 'teacher2', studentId: 'student3', status: 'graded' }
  };
  
  return mockAssignments[assignmentId] || null;
}

async function isAssignmentCreatedByTeacher(assignmentId, teacherId) {
  const assignment = await getAssignmentDetails(assignmentId);
  return assignment?.teacherId === teacherId;
}

async function canTeacherViewStudentAssignment(teacherId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const teacherStudents = {
    'teacher1': ['student1', 'student2'],
    'teacher2': ['student3', 'student4']
  };
  
  return teacherStudents[teacherId]?.includes(studentId) || false;
}

async function canTeacherAccessClass(teacherId, classId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const teacherClasses = {
    'teacher1': ['class1', 'class2'],
    'teacher2': ['class3', 'class4']
  };
  
  return teacherClasses[teacherId]?.includes(classId) || false;
}

async function isAssignmentEditable(assignmentId) {
  const assignment = await getAssignmentDetails(assignmentId);
  return assignment?.status === 'assigned' || assignment?.status === 'in_progress';
}

async function isAssignmentSubmitted(assignmentId) {
  const assignment = await getAssignmentDetails(assignmentId);
  return assignment?.status === 'submitted' || assignment?.status === 'graded';
}

async function isAssignmentDeletable(assignmentId) {
  const assignment = await getAssignmentDetails(assignmentId);
  return assignment?.status === 'assigned' || assignment?.status === 'in_progress';
}