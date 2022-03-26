import { ActivateUserInterceptor } from './activate-user.interceptor';

describe('ActivateUserInterceptor', () => {
  it('should be defined', () => {
    expect(new ActivateUserInterceptor(null)).toBeDefined();
  });
});
