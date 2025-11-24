import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";

class GradeService {
  constructor() {
    this.tableName = "grades_c";
  }

  async getAll() {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "subject_c"}},
          {"field": {"Name": "marks_c"}},
          {"field": {"Name": "maxMarks_c"}},
          {"field": {"Name": "percentage_c"}},
          {"field": {"Name": "gradeLetter_c"}},
          {"field": {"Name": "term_c"}},
          {"field": {"Name": "date_c"}},
          {"field": {"Name": "studentId_c"}}
        ]
      };

      const response = await apperClient.fetchRecords(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      if (!response?.data?.length) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching grades:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "subject_c"}},
          {"field": {"Name": "marks_c"}},
          {"field": {"Name": "maxMarks_c"}},
          {"field": {"Name": "percentage_c"}},
          {"field": {"Name": "gradeLetter_c"}},
          {"field": {"Name": "term_c"}},
          {"field": {"Name": "date_c"}},
          {"field": {"Name": "studentId_c"}}
        ]
      };

      const response = await apperClient.getRecordById(this.tableName, parseInt(id), params);

      if (!response?.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching grade ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  }

  async getByStudentId(studentId) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "subject_c"}},
          {"field": {"Name": "marks_c"}},
          {"field": {"Name": "maxMarks_c"}},
          {"field": {"Name": "percentage_c"}},
          {"field": {"Name": "gradeLetter_c"}},
          {"field": {"Name": "term_c"}},
          {"field": {"Name": "date_c"}},
          {"field": {"Name": "studentId_c"}}
        ],
        where: [{
          "FieldName": "studentId_c",
          "Operator": "EqualTo",
          "Values": [parseInt(studentId)]
        }],
        orderBy: [{
          "fieldName": "date_c",
          "sorttype": "DESC"
        }]
      };

      const response = await apperClient.fetchRecords(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error(`Error fetching grades for student ${studentId}:`, error?.response?.data?.message || error);
      return [];
    }
  }

  async create(gradeData) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        records: [{
          Name: `${gradeData.subject_c} - ${gradeData.term_c}`,
          subject_c: gradeData.subject_c,
          marks_c: parseInt(gradeData.marks_c),
          maxMarks_c: parseInt(gradeData.maxMarks_c),
          percentage_c: gradeData.percentage_c,
          gradeLetter_c: gradeData.gradeLetter_c,
          term_c: gradeData.term_c,
          date_c: gradeData.date_c,
          studentId_c: parseInt(gradeData.studentId_c)
        }]
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
          console.error(`Failed to create ${failed.length} grade records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error creating grade:", error?.response?.data?.message || error);
      return null;
    }
  }

  async update(id, gradeData) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const updateData = {
        Id: parseInt(id)
      };

      if (gradeData.subject_c && gradeData.term_c) {
        updateData.Name = `${gradeData.subject_c} - ${gradeData.term_c}`;
      }
      if (gradeData.subject_c) updateData.subject_c = gradeData.subject_c;
      if (gradeData.marks_c !== undefined) updateData.marks_c = parseInt(gradeData.marks_c);
      if (gradeData.maxMarks_c !== undefined) updateData.maxMarks_c = parseInt(gradeData.maxMarks_c);
      if (gradeData.percentage_c !== undefined) updateData.percentage_c = gradeData.percentage_c;
      if (gradeData.gradeLetter_c) updateData.gradeLetter_c = gradeData.gradeLetter_c;
      if (gradeData.term_c) updateData.term_c = gradeData.term_c;
      if (gradeData.date_c) updateData.date_c = gradeData.date_c;
      if (gradeData.studentId_c !== undefined) updateData.studentId_c = parseInt(gradeData.studentId_c);

      const params = {
        records: [updateData]
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
          console.error(`Failed to update ${failed.length} grade records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error updating grade:", error?.response?.data?.message || error);
      return null;
    }
  }

  async delete(id) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

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
          console.error(`Failed to delete ${failed.length} grade records:`, failed);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length === 1;
      }
    } catch (error) {
      console.error("Error deleting grade:", error?.response?.data?.message || error);
      return false;
    }
  }
}

export default new GradeService();