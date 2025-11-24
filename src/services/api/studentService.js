import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";

class StudentService {
  constructor() {
this.tableName = "Students_c";
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
          {"field": {"Name": "firstName_c"}},
          {"field": {"Name": "lastName_c"}},
          {"field": {"Name": "studentId_c"}},
          {"field": {"Name": "dateOfBirth_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "address_c"}},
          {"field": {"Name": "grade_c"}},
          {"field": {"Name": "section_c"}},
          {"field": {"Name": "status_c"}},
{"field": {"Name": "enrollmentDate_c"}},
          {"field": {"Name": "Tags"}}
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
      console.error("Error fetching students:", error?.response?.data?.message || error);
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
          {"field": {"Name": "firstName_c"}},
          {"field": {"Name": "lastName_c"}},
          {"field": {"Name": "studentId_c"}},
          {"field": {"Name": "dateOfBirth_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "address_c"}},
          {"field": {"Name": "grade_c"}},
          {"field": {"Name": "section_c"}},
          {"field": {"Name": "status_c"}},
{"field": {"Name": "enrollmentDate_c"}},
          {"field": {"Name": "Tags"}}
        ]
      };

      const response = await apperClient.getRecordById(this.tableName, parseInt(id), params);

      if (!response?.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching student ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  }

  async create(studentData) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        records: [{
          Name: `${studentData.firstName_c} ${studentData.lastName_c}`,
          firstName_c: studentData.firstName_c,
          lastName_c: studentData.lastName_c,
          studentId_c: studentData.studentId_c,
          dateOfBirth_c: studentData.dateOfBirth_c,
          email_c: studentData.email_c,
          phone_c: studentData.phone_c || "",
          address_c: studentData.address_c || "",
          grade_c: studentData.grade_c,
          section_c: studentData.section_c || "",
          status_c: studentData.status_c || "Active",
enrollmentDate_c: studentData.enrollmentDate_c || new Date().toISOString().split('T')[0],
          Tags: studentData.Tags || ""
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
          console.error(`Failed to create ${failed.length} student records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error creating student:", error?.response?.data?.message || error);
      return null;
    }
  }

  async update(id, studentData) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const updateData = {
        Id: parseInt(id)
      };

      if (studentData.firstName_c && studentData.lastName_c) {
        updateData.Name = `${studentData.firstName_c} ${studentData.lastName_c}`;
      }
      if (studentData.firstName_c) updateData.firstName_c = studentData.firstName_c;
      if (studentData.lastName_c) updateData.lastName_c = studentData.lastName_c;
      if (studentData.studentId_c) updateData.studentId_c = studentData.studentId_c;
      if (studentData.dateOfBirth_c) updateData.dateOfBirth_c = studentData.dateOfBirth_c;
      if (studentData.email_c) updateData.email_c = studentData.email_c;
      if (studentData.phone_c !== undefined) updateData.phone_c = studentData.phone_c;
      if (studentData.address_c !== undefined) updateData.address_c = studentData.address_c;
      if (studentData.grade_c) updateData.grade_c = studentData.grade_c;
      if (studentData.section_c !== undefined) updateData.section_c = studentData.section_c;
      if (studentData.status_c) updateData.status_c = studentData.status_c;
if (studentData.enrollmentDate_c) updateData.enrollmentDate_c = studentData.enrollmentDate_c;
      if (studentData.Tags !== undefined) updateData.Tags = studentData.Tags;
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
          console.error(`Failed to update ${failed.length} student records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error updating student:", error?.response?.data?.message || error);
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
          console.error(`Failed to delete ${failed.length} student records:`, failed);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length === 1;
      }
    } catch (error) {
      console.error("Error deleting student:", error?.response?.data?.message || error);
      return false;
    }
  }
}

export default new StudentService();