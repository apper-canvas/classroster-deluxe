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
      gradeId, 
      gradeIds, 
      studentId, 
      assignmentId, 
      userRole,
      classId,
      gradingPeriod 
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

    // Define grade access policies
    const accessPolicies = {
      admin: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: true,
        canCreateAll: true,
        canViewReports: true,
        canExportGrades: true
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
        canViewStudentGrades: true,
        canEditStudentGrades: true,
        canViewClassReports: true,
        canExportClassGrades: true
      },
      student: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewOwn: true,
        canViewOwnReports: true
      },
      parent: {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canCreateAll: false,
        canViewChildGrades: true,
        canViewChildReports: true
      }
    };

    const userPolicy = accessPolicies[userRole] || accessPolicies.student;

    switch (action) {
      case 'canViewGrade':
        const viewResult = await processViewGradeAccess(userPolicy, userId, gradeId, studentId, userRole);
        return new Response(JSON.stringify(viewResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canEditGrade':
        const editResult = await processEditGradeAccess(userPolicy, userId, gradeId, studentId, assignmentId, userRole);
        return new Response(JSON.stringify(editResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canCreateGrade':
        const createResult = await processCreateGradeAccess(userPolicy, userId, studentId, assignmentId, userRole);
        return new Response(JSON.stringify(createResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canDeleteGrade':
        const deleteResult = await processDeleteGradeAccess(userPolicy, userId, gradeId, userRole);
        return new Response(JSON.stringify(deleteResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'filterGrades':
        const filterResult = await filterGradesByAccess(userPolicy, userId, gradeIds || [], userRole);
        return new Response(JSON.stringify(filterResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'getStudentGrades':
        const studentGradesResult = await getStudentGradesAccess(userPolicy, userId, studentId, gradingPeriod, userRole);
        return new Response(JSON.stringify(studentGradesResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'getClassGrades':
        const classGradesResult = await getClassGradesAccess(userPolicy, userId, classId, gradingPeriod, userRole);
        return new Response(JSON.stringify(classGradesResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'canExportGrades':
        const exportResult = await processExportGradesAccess(userPolicy, userId, classId, studentId, userRole);
        return new Response(JSON.stringify(exportResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action specified',
          validActions: [
            'canViewGrade', 'canEditGrade', 'canCreateGrade', 'canDeleteGrade', 
            'filterGrades', 'getStudentGrades', 'getClassGrades', 'canExportGrades'
          ]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error processing grade access policy',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function processViewGradeAccess(policy, userId, gradeId, studentId, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full view access'
      };
    }

    if (!gradeId && !studentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Grade ID or Student ID is required'
      };
    }

    const grade = gradeId ? await getGradeDetails(gradeId) : null;
    const targetStudentId = studentId || grade?.studentId;

    if (!targetStudentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Cannot determine student for grade access'
      };
    }

    // Teacher can view grades for their students
    if (userRole === 'teacher' && policy.canViewStudentGrades) {
      const hasStudentAccess = await canTeacherViewStudentGrades(userId, targetStudentId);
      const hasAssignmentAccess = grade?.assignmentId ? await canTeacherAccessAssignment(userId, grade.assignmentId) : true;
      
      return {
        success: true,
        allowed: hasStudentAccess && hasAssignmentAccess,
        reason: !hasStudentAccess ? 'Student not assigned to this teacher' :
                !hasAssignmentAccess ? 'No access to assignment' : 'Teacher can view student grades'
      };
    }

    // Student can view their own grades
    if (userRole === 'student' && policy.canViewOwn) {
      return {
        success: true,
        allowed: targetStudentId === userId,
        reason: targetStudentId === userId ? 'Student viewing own grades' : 'Cannot view other student grades'
      };
    }

    // Parent can view their child's grades
    if (userRole === 'parent' && policy.canViewChildGrades) {
      const isParentChild = await isStudentParentChild(userId, targetStudentId);
      return {
        success: true,
        allowed: isParentChild,
        reason: isParentChild ? 'Parent viewing child grades' : 'Not authorized to view this student grades'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Grade view access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing view grade access',
      details: error.message
    };
  }
}

async function processEditGradeAccess(policy, userId, gradeId, studentId, assignmentId, userRole) {
  try {
    if (policy.canEditAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has full edit access'
      };
    }

    const grade = gradeId ? await getGradeDetails(gradeId) : null;
    const targetStudentId = studentId || grade?.studentId;
    const targetAssignmentId = assignmentId || grade?.assignmentId;

    if (!targetStudentId || !targetAssignmentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Student ID and Assignment ID are required for grade editing'
      };
    }

    // Only teachers can edit grades
    if (userRole === 'teacher' && policy.canEditStudentGrades) {
      const hasStudentAccess = await canTeacherViewStudentGrades(userId, targetStudentId);
      const hasAssignmentAccess = await canTeacherAccessAssignment(userId, targetAssignmentId);
      const isGradeEditable = await isGradeEditable(gradeId, targetAssignmentId);
      
      return {
        success: true,
        allowed: hasStudentAccess && hasAssignmentAccess && isGradeEditable,
        reason: !hasStudentAccess ? 'Student not assigned to this teacher' :
                !hasAssignmentAccess ? 'No access to assignment' :
                !isGradeEditable ? 'Grade is locked or finalized' : 'Teacher can edit student grade'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Grade edit access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing edit grade access',
      details: error.message
    };
  }
}

async function processCreateGradeAccess(policy, userId, studentId, assignmentId, userRole) {
  try {
    if (policy.canCreateAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can create grades'
      };
    }

    if (!studentId || !assignmentId) {
      return {
        success: true,
        allowed: false,
        reason: 'Student ID and Assignment ID are required for grade creation'
      };
    }

    // Only teachers can create grades
    if (userRole === 'teacher' && policy.canCreateOwn) {
      const hasStudentAccess = await canTeacherViewStudentGrades(userId, studentId);
      const hasAssignmentAccess = await canTeacherAccessAssignment(userId, assignmentId);
      const canCreateGrade = await canCreateGradeForAssignment(assignmentId, studentId);
      
      return {
        success: true,
        allowed: hasStudentAccess && hasAssignmentAccess && canCreateGrade,
        reason: !hasStudentAccess ? 'Student not assigned to this teacher' :
                !hasAssignmentAccess ? 'No access to assignment' :
                !canCreateGrade ? 'Grade already exists or assignment not ready' : 'Teacher can create grade'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Grade creation access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing create grade access',
      details: error.message
    };
  }
}

async function processDeleteGradeAccess(policy, userId, gradeId, userRole) {
  try {
    if (policy.canDeleteAll) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin has delete access'
      };
    }

    if (!gradeId) {
      return {
        success: true,
        allowed: false,
        reason: 'Grade ID is required'
      };
    }

    const grade = await getGradeDetails(gradeId);
    
    if (!grade) {
      return {
        success: true,
        allowed: false,
        reason: 'Grade not found'
      };
    }

    // Teachers can delete grades they created within certain conditions
    if (userRole === 'teacher' && policy.canDeleteOwn) {
      const hasStudentAccess = await canTeacherViewStudentGrades(userId, grade.studentId);
      const hasAssignmentAccess = await canTeacherAccessAssignment(userId, grade.assignmentId);
      const isGradeDeletable = await isGradeDeletable(gradeId);
      
      return {
        success: true,
        allowed: hasStudentAccess && hasAssignmentAccess && isGradeDeletable,
        reason: !hasStudentAccess ? 'Student not assigned to this teacher' :
                !hasAssignmentAccess ? 'No access to assignment' :
                !isGradeDeletable ? 'Grade cannot be deleted (finalized/reported)' : 'Teacher can delete grade'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Grade delete access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing delete grade access',
      details: error.message
    };
  }
}

async function filterGradesByAccess(policy, userId, gradeIds, userRole) {
  try {
    if (policy.canViewAll) {
      return {
        success: true,
        filteredIds: gradeIds,
        reason: 'Admin can view all grades'
      };
    }

    const accessibleGrades = [];
    
    for (const gradeId of gradeIds) {
      const grade = await getGradeDetails(gradeId);
      
      if (grade) {
        let hasAccess = false;
        
        if (userRole === 'teacher') {
          const hasStudentAccess = await canTeacherViewStudentGrades(userId, grade.studentId);
          const hasAssignmentAccess = await canTeacherAccessAssignment(userId, grade.assignmentId);
          hasAccess = hasStudentAccess && hasAssignmentAccess;
        } else if (userRole === 'student') {
          hasAccess = grade.studentId === userId;
        } else if (userRole === 'parent') {
          hasAccess = await isStudentParentChild(userId, grade.studentId);
        }
        
        if (hasAccess) {
          accessibleGrades.push(gradeId);
        }
      }
    }

    return {
      success: true,
      filteredIds: accessibleGrades,
      reason: `Filtered to ${accessibleGrades.length} accessible grades`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error filtering grades by access',
      details: error.message
    };
  }
}

async function getStudentGradesAccess(policy, userId, studentId, gradingPeriod, userRole) {
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
        reason: 'Admin can view all student grades'
      };
    }

    // Teacher can view grades for their students
    if (userRole === 'teacher' && policy.canViewStudentGrades) {
      const hasStudentAccess = await canTeacherViewStudentGrades(userId, studentId);
      return {
        success: true,
        allowed: hasStudentAccess,
        reason: hasStudentAccess ? 'Teacher can view student grades' : 'Student not assigned to this teacher'
      };
    }

    // Student can view their own grades
    if (userRole === 'student' && policy.canViewOwn) {
      return {
        success: true,
        allowed: studentId === userId,
        reason: studentId === userId ? 'Student viewing own grades' : 'Cannot view other student grades'
      };
    }

    // Parent can view their child's grades
    if (userRole === 'parent' && policy.canViewChildGrades) {
      const isParentChild = await isStudentParentChild(userId, studentId);
      return {
        success: true,
        allowed: isParentChild,
        reason: isParentChild ? 'Parent viewing child grades' : 'Not authorized to view this student grades'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Student grades access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing student grades access',
      details: error.message
    };
  }
}

async function getClassGradesAccess(policy, userId, classId, gradingPeriod, userRole) {
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
        reason: 'Admin can view all class grades'
      };
    }

    // Teacher can view grades for their classes
    if (userRole === 'teacher' && policy.canViewClassReports) {
      const hasClassAccess = await canTeacherAccessClass(userId, classId);
      return {
        success: true,
        allowed: hasClassAccess,
        reason: hasClassAccess ? 'Teacher can view class grades' : 'No access to this class'
      };
    }

    return {
      success: true,
      allowed: false,
      reason: 'Class grades access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing class grades access',
      details: error.message
    };
  }
}

async function processExportGradesAccess(policy, userId, classId, studentId, userRole) {
  try {
    if (policy.canExportGrades) {
      return {
        success: true,
        allowed: true,
        reason: 'Admin can export all grades'
      };
    }

    // Teacher can export grades for their classes/students
    if (userRole === 'teacher' && policy.canExportClassGrades) {
      if (classId) {
        const hasClassAccess = await canTeacherAccessClass(userId, classId);
        return {
          success: true,
          allowed: hasClassAccess,
          reason: hasClassAccess ? 'Teacher can export class grades' : 'No access to this class'
        };
      } else if (studentId) {
        const hasStudentAccess = await canTeacherViewStudentGrades(userId, studentId);
        return {
          success: true,
          allowed: hasStudentAccess,
          reason: hasStudentAccess ? 'Teacher can export student grades' : 'Student not assigned to this teacher'
        };
      }
    }

    return {
      success: true,
      allowed: false,
      reason: 'Grade export access denied'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error processing export grades access',
      details: error.message
    };
  }
}

// Mock database functions - replace with actual database queries
async function getGradeDetails(gradeId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const mockGrades = {
    'grade1': { id: 'grade1', studentId: 'student1', assignmentId: 'assign1', teacherId: 'teacher1', score: 85, status: 'finalized' },
    'grade2': { id: 'grade2', studentId: 'student2', assignmentId: 'assign2', teacherId: 'teacher1', score: 92, status: 'draft' },
    'grade3': { id: 'grade3', studentId: 'student3', assignmentId: 'assign3', teacherId: 'teacher2', score: 78, status: 'finalized' }
  };
  
  return mockGrades[gradeId] || null;
}

async function canTeacherViewStudentGrades(teacherId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const teacherStudents = {
    'teacher1': ['student1', 'student2'],
    'teacher2': ['student3', 'student4']
  };
  
  return teacherStudents[teacherId]?.includes(studentId) || false;
}

async function canTeacherAccessAssignment(teacherId, assignmentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const mockAssignments = {
    'assign1': 'teacher1',
    'assign2': 'teacher1',
    'assign3': 'teacher2'
  };
  
  return mockAssignments[assignmentId] === teacherId;
}

async function canTeacherAccessClass(teacherId, classId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const teacherClasses = {
    'teacher1': ['class1', 'class2'],
    'teacher2': ['class3', 'class4']
  };
  
  return teacherClasses[teacherId]?.includes(classId) || false;
}

async function isStudentParentChild(parentId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const parentChildren = {
    'parent1': ['student1', 'student2'],
    'parent2': ['student3']
  };
  
  return parentChildren[parentId]?.includes(studentId) || false;
}

async function isGradeEditable(gradeId, assignmentId) {
  const grade = await getGradeDetails(gradeId);
  return grade?.status === 'draft' || grade?.status === 'pending';
}

async function isGradeDeletable(gradeId) {
  const grade = await getGradeDetails(gradeId);
  return grade?.status === 'draft' && !grade?.reported;
}

async function canCreateGradeForAssignment(assignmentId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Check if grade already exists
  const existingGrade = await findExistingGrade(assignmentId, studentId);
  return !existingGrade;
}

async function findExistingGrade(assignmentId, studentId) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mock check for existing grade
  return null; // Assume no existing grade for simplicity
}