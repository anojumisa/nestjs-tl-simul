import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should call authService.login with dto', async () => {
    const dto = { email: 'mentor@learning.local', password: 'MentorDemo123' };
    authServiceMock.login.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: { id: 1, email: 'mentor@learning.local', role: 'admin' },
    });

    const result = await controller.login(dto);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: { id: 1, email: 'mentor@learning.local', role: 'admin' },
    });
  });

  it('refresh should call authService.refresh with dto', async () => {
    const dto = { refreshToken: 'existing-refresh-token' };
    authServiceMock.refresh.mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      user: { id: 1, email: 'mentor@learning.local', role: 'admin' },
    });

    const result = await controller.refresh(dto);

    expect(authServiceMock.refresh).toHaveBeenCalledWith(dto);
    expect(result.access_token).toBe('new-access-token');
  });
});
