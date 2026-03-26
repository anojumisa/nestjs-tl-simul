import { InMemoryCourseRepository } from '../repositories/in-memory-course.repository';

/**
 * Contoh **anti-pola** untuk perbandingan di kelas: dependency dibuat sendiri dengan `new`.
 *
 * - **Jangan** daftarkan class ini di `providers` Nest — ini hanya bahan baca di IDE.
 * - **Bandingkan** dengan `CoursesService` asli: constructor + `@Inject('COURSE_REPOSITORY')`.
 *
 * Akibat praktis: sulit mengganti ke Prisma/mock, service terikat erat ke satu class konkret,
 * dan instance repository tidak terkelola oleh container Nest (bisa duplikasi logika config).
 */
export class CoursesServiceWithoutDiExample {
  private readonly coursesRepository = new InMemoryCourseRepository();

  findAll() {
    return this.coursesRepository.findAll();
  }

  async findOne(id: number) {
    return this.coursesRepository.findOne(id);
  }
}
