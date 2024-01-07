import { render } from '@testing-library/react';

import FrontendSharedComponents from './frontend-shared-components';

describe('FrontendSharedComponents', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendSharedComponents />);
    expect(baseElement).toBeTruthy();
  });
});
