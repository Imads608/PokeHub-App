import { OauthInterceptor } from './oauth.interceptor';

describe('OauthInterceptor', () => {
  it('should be defined', () => {
    expect(new OauthInterceptor(null)).toBeDefined();
  });
});
