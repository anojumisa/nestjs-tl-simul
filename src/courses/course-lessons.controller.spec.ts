import { Test, TestingModule } from '@nestjs/testing';
import { CourseLessonsController } from './course-lessons.controller';
import { CoursesService } from './courses.service';

describe('CourseLessonsController', () => {
  let controller: CourseLessonsController;

  const coursesServiceMock = {
    findLessonsForCourse: jest.fn(),
    addLesson: jest.fn(),
    removeLesson: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseLessonsController],
      providers: [{ provide: CoursesService, useValue: coursesServiceMock }],
    }).compile();

    controller = module.get<CourseLessonsController>(CourseLessonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listForCourse should call coursesService.findLessonsForCourse', async () => {
    coursesServiceMock.findLessonsForCourse.mockResolvedValue([
      { id: 1, title: 'Intro', sortOrder: 1 },
    ]);

    const result = await controller.listForCourse(10);

    expect(coursesServiceMock.findLessonsForCourse).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: 1, title: 'Intro', sortOrder: 1 }]);
  });

  it('create should call coursesService.addLesson', async () => {
    const dto = { title: 'Lesson A', sortOrder: 2 };
    coursesServiceMock.addLesson.mockResolvedValue({
      id: 2,
      title: 'Lesson A',
      sortOrder: 2,
      courseId: 10,
    });

    const result = await controller.create(10, dto);

    expect(coursesServiceMock.addLesson).toHaveBeenCalledWith(10, dto);
    expect(result.id).toBe(2);
  });

  it('remove should call coursesService.removeLesson', async () => {
    coursesServiceMock.removeLesson.mockResolvedValue({
      message: 'Lesson with id 3 deleted for course 10',
    });

    const result = await controller.remove(10, 3);

    expect(coursesServiceMock.removeLesson).toHaveBeenCalledWith(10, 3);
    expect(result).toEqual({
      message: 'Lesson with id 3 deleted for course 10',
    });
  });
});
