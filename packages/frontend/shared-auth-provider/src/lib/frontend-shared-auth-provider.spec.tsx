import FrontendSharedAuthProvider from './frontend-shared-auth-provider';
import { render } from '@testing-library/react';

describe('FrontendSharedAuthProvider', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendSharedAuthProvider />);
    expect(baseElement).toBeTruthy();
  });
});
