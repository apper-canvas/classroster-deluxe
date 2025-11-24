import attendanceData from "@/services/mockData/attendance.json";

class AttendanceService {
  constructor() {
    this.data = [...attendanceData];
  }

  async delay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
  }

  async getAll() {
    await this.delay();
    return [...this.data];
  }

  async getById(id) {
    await this.delay();
    const record = this.data.find(item => item.Id === parseInt(id));
    if (!record) {
      throw new Error("Attendance record not found");
    }
    return { ...record };
  }

  async getByStudentId(studentId) {
    await this.delay();
    return this.data
      .filter(item => item.studentId === studentId.toString())
      .map(item => ({ ...item }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async getByDate(date) {
    await this.delay();
    const targetDate = date.split('T')[0];
    return this.data
      .filter(item => item.date.split('T')[0] === targetDate)
      .map(item => ({ ...item }));
  }

  async create(attendanceRecord) {
    await this.delay();
    
    const maxId = this.data.length > 0 ? Math.max(...this.data.map(item => item.Id)) : 0;
    const newRecord = {
      ...attendanceRecord,
      Id: maxId + 1,
      id: (maxId + 1).toString(),
      date: attendanceRecord.date + "T00:00:00.000Z"
    };
    
    this.data.push(newRecord);
    return { ...newRecord };
  }

  async update(id, attendanceRecord) {
    await this.delay();
    
    const index = this.data.findIndex(item => item.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Attendance record not found");
    }
    
    this.data[index] = {
      ...this.data[index],
      ...attendanceRecord,
      Id: this.data[index].Id,
      id: this.data[index].id,
      date: attendanceRecord.date + "T00:00:00.000Z"
    };
    
    return { ...this.data[index] };
  }

  async delete(id) {
    await this.delay();
    
    const index = this.data.findIndex(item => item.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Attendance record not found");
    }
    
    const deleted = this.data[index];
    this.data.splice(index, 1);
    return { ...deleted };
  }
}

export default new AttendanceService();