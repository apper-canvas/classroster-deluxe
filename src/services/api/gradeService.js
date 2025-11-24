import mockData from "../mockData/grades.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class GradeService {
  constructor() {
    this.data = [...mockData];
    this.nextId = Math.max(...this.data.map(item => item.Id || item.id), 0) + 1;
  }

  async getAll() {
    try {
      await delay(300);
      return [...this.data];
    } catch (error) {
      console.error("Error fetching grades:", error?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      await delay(300);
      const item = this.data.find(g => (g.Id || g.id) === parseInt(id));
      return item ? { ...item } : null;
    } catch (error) {
      console.error(`Error fetching grade ${id}:`, error?.message || error);
      return null;
    }
  }

  async getByStudentId(studentId) {
    try {
      await delay(300);
      const filteredGrades = this.data.filter(g => (g.studentId_c || g.studentId) === parseInt(studentId));
      return filteredGrades.map(g => ({ ...g }));
    } catch (error) {
      console.error(`Error fetching grades for student ${studentId}:`, error?.message || error);
      return [];
    }
  }

  async create(gradeData) {
    try {
      await delay(300);
      const newGrade = {
        ...gradeData,
        Id: this.nextId++,
        Name: `${gradeData.studentId_c} - ${gradeData.subject_c} - ${gradeData.term_c}`
      };
      this.data.push(newGrade);
      return { ...newGrade };
    } catch (error) {
      console.error("Error creating grade:", error?.message || error);
      return null;
    }
  }

  async update(id, gradeData) {
    try {
      await delay(300);
      const index = this.data.findIndex(g => (g.Id || g.id) === parseInt(id));
      if (index === -1) return null;
      
      const updated = {
        ...this.data[index],
        ...gradeData,
        Name: `${gradeData.studentId_c} - ${gradeData.subject_c} - ${gradeData.term_c}`
      };
      this.data[index] = updated;
      return { ...updated };
    } catch (error) {
      console.error("Error updating grade:", error?.message || error);
      return null;
    }
  }

  async delete(id) {
    try {
      await delay(300);
      const index = this.data.findIndex(g => (g.Id || g.id) === parseInt(id));
      if (index === -1) return false;
      
      this.data.splice(index, 1);
      return true;
    } catch (error) {
      console.error("Error deleting grade:", error?.message || error);
      return false;
    }
  }
}

export default new GradeService();