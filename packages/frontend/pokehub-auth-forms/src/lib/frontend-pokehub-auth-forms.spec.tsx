import { render } from '@testing-library/react';

import FrontendPokehubAuthForms from './frontend-pokehub-auth-forms';

describe('FrontendPokehubAuthForms', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendPokehubAuthForms />);
    expect(baseElement).toBeTruthy();
  });
});
