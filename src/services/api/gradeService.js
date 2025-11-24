import gradesData from "@/services/mockData/grades.json";

class GradeService {
  constructor() {
    this.data = [...gradesData];
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
    const grade = this.data.find(item => item.Id === parseInt(id));
    if (!grade) {
      throw new Error("Grade not found");
    }
    return { ...grade };
  }

  async getByStudentId(studentId) {
    await this.delay();
    return this.data
      .filter(item => item.studentId === studentId.toString())
      .map(item => ({ ...item }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async create(gradeData) {
    await this.delay();
    
    const maxId = this.data.length > 0 ? Math.max(...this.data.map(item => item.Id)) : 0;
    const newGrade = {
      ...gradeData,
      Id: maxId + 1,
      id: (maxId + 1).toString(),
      date: gradeData.date + "T10:00:00.000Z"
    };
    
    this.data.push(newGrade);
    return { ...newGrade };
  }

  async update(id, gradeData) {
    await this.delay();
    
    const index = this.data.findIndex(item => item.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Grade not found");
    }
    
    this.data[index] = {
      ...this.data[index],
      ...gradeData,
      Id: this.data[index].Id,
      id: this.data[index].id,
      date: gradeData.date + "T10:00:00.000Z"
    };
    
    return { ...this.data[index] };
  }

  async delete(id) {
    await this.delay();
    
    const index = this.data.findIndex(item => item.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Grade not found");
    }
    
    const deleted = this.data[index];
    this.data.splice(index, 1);
    return { ...deleted };
  }
}

export default new GradeService();