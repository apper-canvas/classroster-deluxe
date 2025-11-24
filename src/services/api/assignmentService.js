import { toast } from 'react-toastify';

class AssignmentService {
  constructor() {
    this.tableName = 'assignments_c';
  }

  async getAll() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "student_c"}},
          {"field": {"Name": "dueDate_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "grade_c"}},
          {"field": {"Name": "assignmentType_c"}},
          {"field": {"Name": "notes_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        orderBy: [{"fieldName": "dueDate_c", "sorttype": "DESC"}],
        pagingInfo: {"limit": 100, "offset": 0}
      };

      const response = await apperClient.fetchRecords(this.tableName, params);

      if (!response?.data?.length) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching assignments:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "student_c"}},
          {"field": {"Name": "dueDate_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "grade_c"}},
          {"field": {"Name": "assignmentType_c"}},
          {"field": {"Name": "notes_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ]
      };

      const response = await apperClient.getRecordById(this.tableName, parseInt(id), params);
      return response?.data || null;
    } catch (error) {
      console.error(`Error fetching assignment ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  }

  async getByStudent(studentId) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "student_c"}},
          {"field": {"Name": "dueDate_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "grade_c"}},
          {"field": {"Name": "assignmentType_c"}},
          {"field": {"Name": "notes_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        where: [{
          "FieldName": "student_c",
          "Operator": "EqualTo",
          "Values": [parseInt(studentId)]
        }],
        orderBy: [{"fieldName": "dueDate_c", "sorttype": "DESC"}]
      };

      const response = await apperClient.fetchRecords(this.tableName, params);
      return response?.data || [];
    } catch (error) {
      console.error(`Error fetching assignments for student ${studentId}:`, error?.response?.data?.message || error);
      return [];
    }
  }

  async create(assignmentData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Filter out non-updateable fields and prepare data
      const preparedData = {};
      
      if (assignmentData.Name) preparedData.Name = assignmentData.Name;
      if (assignmentData.title_c) preparedData.title_c = assignmentData.title_c;
      if (assignmentData.student_c) preparedData.student_c = parseInt(assignmentData.student_c?.Id || assignmentData.student_c);
      if (assignmentData.dueDate_c) preparedData.dueDate_c = assignmentData.dueDate_c;
      if (assignmentData.description_c) preparedData.description_c = assignmentData.description_c;
      if (assignmentData.status_c) preparedData.status_c = assignmentData.status_c;
      if (assignmentData.grade_c) preparedData.grade_c = assignmentData.grade_c;
      if (assignmentData.assignmentType_c) preparedData.assignmentType_c = assignmentData.assignmentType_c;
      if (assignmentData.notes_c) preparedData.notes_c = assignmentData.notes_c;

      const params = {
        records: [preparedData]
      };

      const response = await apperClient.createRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} assignments:${JSON.stringify(failed)}`);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          toast.success('Assignment created successfully');
          return successful[0].data;
        }
      }

      return null;
    } catch (error) {
      console.error("Error creating assignment:", error?.response?.data?.message || error);
      return null;
    }
  }

  async update(id, assignmentData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Filter out non-updateable fields and prepare data
      const preparedData = { Id: parseInt(id) };
      
      if (assignmentData.Name !== undefined) preparedData.Name = assignmentData.Name;
      if (assignmentData.title_c !== undefined) preparedData.title_c = assignmentData.title_c;
      if (assignmentData.student_c !== undefined) preparedData.student_c = parseInt(assignmentData.student_c?.Id || assignmentData.student_c);
      if (assignmentData.dueDate_c !== undefined) preparedData.dueDate_c = assignmentData.dueDate_c;
      if (assignmentData.description_c !== undefined) preparedData.description_c = assignmentData.description_c;
      if (assignmentData.status_c !== undefined) preparedData.status_c = assignmentData.status_c;
      if (assignmentData.grade_c !== undefined) preparedData.grade_c = assignmentData.grade_c;
      if (assignmentData.assignmentType_c !== undefined) preparedData.assignmentType_c = assignmentData.assignmentType_c;
      if (assignmentData.notes_c !== undefined) preparedData.notes_c = assignmentData.notes_c;

      const params = {
        records: [preparedData]
      };

      const response = await apperClient.updateRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} assignments:${JSON.stringify(failed)}`);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          toast.success('Assignment updated successfully');
          return successful[0].data;
        }
      }

      return null;
    } catch (error) {
      console.error("Error updating assignment:", error?.response?.data?.message || error);
      return null;
    }
  }

  async delete(id) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} assignments:${JSON.stringify(failed)}`);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          toast.success('Assignment deleted successfully');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error deleting assignment:", error?.response?.data?.message || error);
      return false;
    }
  }
}

const assignmentService = new AssignmentService();
export default assignmentService;