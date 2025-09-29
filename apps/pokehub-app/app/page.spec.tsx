import Page from './page';
import { render, screen } from '@testing-library/react';

describe('Page', () => {
  it('should render the main heading', () => {
    render(<Page />);

    const heading = screen.getByRole('heading', {
      name: /Begin Your Pokémon Journey/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
