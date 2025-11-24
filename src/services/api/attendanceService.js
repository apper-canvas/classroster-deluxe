import mockData from "../mockData/attendance.json";
import { toast } from "react-toastify";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class AttendanceService {
  constructor() {
    this.data = [...mockData];
    this.nextId = Math.max(...this.data.map(item => item.Id || item.id), 0) + 1;
  }

  async getAll() {
    try {
      await delay(300);
      return [...this.data];
    } catch (error) {
      console.error("Error fetching attendance:", error?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      await delay(300);
      const item = this.data.find(a => (a.Id || a.id) === parseInt(id));
      return item ? { ...item } : null;
    } catch (error) {
      console.error(`Error fetching attendance record ${id}:`, error?.message || error);
      return null;
    }
  }

  async getByStudentId(studentId) {
    try {
      await delay(300);
      const filteredRecords = this.data
        .filter(a => (a.studentId_c || a.studentId) === parseInt(studentId))
        .sort((a, b) => new Date(b.date_c || b.date) - new Date(a.date_c || a.date));
      return filteredRecords.map(a => ({ ...a }));
    } catch (error) {
      console.error(`Error fetching attendance for student ${studentId}:`, error?.message || error);
      return [];
    }
  }

  async getByDate(date) {
    try {
      await delay(300);
      const targetDate = date.split('T')[0];
      const filteredRecords = this.data.filter(a => (a.date_c || a.date).split('T')[0] === targetDate);
      return filteredRecords.map(a => ({ ...a }));
    } catch (error) {
      console.error(`Error fetching attendance for date ${date}:`, error?.message || error);
      return [];
    }
  }

  async create(attendanceRecord) {
    try {
      await delay(300);
      const newRecord = {
        ...attendanceRecord,
        Id: this.nextId++,
        Name: `${attendanceRecord.studentId_c} - ${attendanceRecord.date_c}`
      };
      this.data.push(newRecord);
      return { ...newRecord };
    } catch (error) {
      console.error("Error creating attendance record:", error?.message || error);
      return null;
    }
  }

  async update(id, attendanceRecord) {
    try {
      await delay(300);
      const index = this.data.findIndex(a => (a.Id || a.id) === parseInt(id));
      if (index === -1) return null;
      
      const updated = {
        ...this.data[index],
        ...attendanceRecord,
        Name: `${attendanceRecord.studentId_c} - ${attendanceRecord.date_c}`
      };
      this.data[index] = updated;
      return { ...updated };
    } catch (error) {
      console.error("Error updating attendance record:", error?.message || error);
      return null;
    }
  }

  async delete(id) {
    try {
      await delay(300);
      const index = this.data.findIndex(a => (a.Id || a.id) === parseInt(id));
      if (index === -1) return false;
      
      this.data.splice(index, 1);
      return true;
    } catch (error) {
      console.error("Error deleting attendance record:", error?.message || error);
      return false;
    }
  }
}

export default new AttendanceService();