import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: 'COURSE_REPOSITORY',
          useValue: {
            findAll: jest.fn().mockResolvedValue({
              items: [],
              total: 0,
              page: 1,
              limit: 1,
            }),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findLessonsByCourseId: jest.fn(),
            createLesson: jest.fn(),
            removeLesson: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
