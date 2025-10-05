import { render } from '@testing-library/react';

import FrontendSharedFormComponents from './frontend-shared-form-components';

describe('FrontendSharedFormComponents', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendSharedFormComponents />);
    expect(baseElement).toBeTruthy();
  });
});
