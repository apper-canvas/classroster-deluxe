import studentsData from "@/services/mockData/students.json";

class StudentService {
  constructor() {
    this.data = [...studentsData];
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
    const student = this.data.find(item => item.Id === parseInt(id));
    if (!student) {
      throw new Error("Student not found");
    }
    return { ...student };
  }

  async create(studentData) {
    await this.delay();
    
    const maxId = this.data.length > 0 ? Math.max(...this.data.map(item => item.Id)) : 0;
    const newStudent = {
      ...studentData,
      Id: maxId + 1,
      id: (maxId + 1).toString(),
      createdAt: new Date().toISOString(),
      enrollmentDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0]
    };
    
    this.data.push(newStudent);
    return { ...newStudent };
  }

  async update(id, studentData) {
    await this.delay();
    
    const index = this.data.findIndex(item => item.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Student not found");
    }
    
    this.data[index] = {
      ...this.data[index],
      ...studentData,
      Id: this.data[index].Id,
      id: this.data[index].id
    };
    
    return { ...this.data[index] };
  }

  async delete(id) {
    await this.delay();
    
    const index = this.data.findIndex(item => item.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Student not found");
    }
    
    const deleted = this.data[index];
    this.data.splice(index, 1);
    return { ...deleted };
  }
}

export default new StudentService();