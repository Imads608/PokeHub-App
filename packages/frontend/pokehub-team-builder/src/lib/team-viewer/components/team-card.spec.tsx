import {
  createMockTeam,
  createMockPokemon,
} from '../../../test-utils/team-viewer-test-utils';
import { TeamCard } from './team-card';
import type { GenerationNum } from '@pkmn/dex';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock @pkmn/img
jest.mock('@pkmn/img', () => ({
  Icons: {
    getPokemon: jest.fn(() => ({
      css: { backgroundImage: 'url(pokemon-sprite.png)' },
    })),
  },
}));

// Mock dex-data-provider
jest.mock('@pokehub/frontend/dex-data-provider', () => ({
  getFormatDisplayName: jest.fn((_gen, format) => {
    const formatMap: Record<string, string> = {
      ou: 'OU',
      vgc2024rege: 'VGC 2024 Reg E',
    };
    return formatMap[format] || format;
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe('TeamCard', () => {
  const mockTeam = createMockTeam({
    id: 'team-123',
    name: 'My Competitive Team',
    generation: 9 as GenerationNum,
    format: 'ou',
    pokemon: [
      createMockPokemon({ species: 'Pikachu' }),
      createMockPokemon({ species: 'Charizard' }),
    ],
    updatedAt: new Date('2024-01-15T00:00:00.000Z'),
  });

  const mockOnEdit = jest.fn();
  const mockOnDuplicate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display team name', () => {
      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('My Competitive Team')).toBeInTheDocument();
    });

    it('should display format badge', () => {
      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('OU')).toBeInTheDocument();
    });

    it('should display "Updated" timestamp', () => {
      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    it('should render Pokemon sprites', () => {
      const { container } = render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      // Should have 2 Pokemon sprites
      const sprites = container.querySelectorAll('span[style]');
      expect(sprites.length).toBeGreaterThanOrEqual(2);
    });

    it('should link to team editor', () => {
      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/team-builder/team-123');
    });
  });

  describe('dropdown menu', () => {
    it('should show menu button', () => {
      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(
        screen.getByRole('button', { name: /open menu/i })
      ).toBeInTheDocument();
    });

    it('should show menu options when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /edit/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('menuitem', { name: /duplicate/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('menuitem', { name: /delete/i })
        ).toBeInTheDocument();
      });
    });

    it('should call onEdit with team ID when Edit is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /edit/i })
        ).toBeInTheDocument();
      });

      const editOption = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editOption);

      expect(mockOnEdit).toHaveBeenCalledWith('team-123');
    });

    it('should call onDuplicate with team when Duplicate is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /duplicate/i })
        ).toBeInTheDocument();
      });

      const duplicateOption = screen.getByRole('menuitem', {
        name: /duplicate/i,
      });
      await user.click(duplicateOption);

      expect(mockOnDuplicate).toHaveBeenCalledWith(mockTeam);
    });

    it('should call onDelete with team when Delete is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamCard
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /delete/i })
        ).toBeInTheDocument();
      });

      const deleteOption = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteOption);

      expect(mockOnDelete).toHaveBeenCalledWith(mockTeam);
    });
  });

  describe('edge cases', () => {
    it('should handle team with single Pokemon', () => {
      const teamWithOnePokemon = createMockTeam({
        pokemon: [createMockPokemon({ species: 'Pikachu' })],
      });

      const { container } = render(
        <TeamCard
          team={teamWithOnePokemon}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const sprites = container.querySelectorAll('span[style]');
      expect(sprites.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle team with six Pokemon', () => {
      const teamWithSixPokemon = createMockTeam({
        pokemon: [
          createMockPokemon({ species: 'Pikachu' }),
          createMockPokemon({ species: 'Charizard' }),
          createMockPokemon({ species: 'Blastoise' }),
          createMockPokemon({ species: 'Venusaur' }),
          createMockPokemon({ species: 'Gengar' }),
          createMockPokemon({ species: 'Machamp' }),
        ],
      });

      const { container } = render(
        <TeamCard
          team={teamWithSixPokemon}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const sprites = container.querySelectorAll('span[style]');
      expect(sprites.length).toBeGreaterThanOrEqual(6);
    });

    it('should handle team without updatedAt', () => {
      const teamWithoutUpdate = createMockTeam({
        updatedAt: undefined,
      });

      render(
        <TeamCard
          team={teamWithoutUpdate}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/updated/i)).not.toBeInTheDocument();
    });

    it('should truncate long team names', () => {
      const teamWithLongName = createMockTeam({
        name: 'This is a very long team name that should be truncated in the UI',
      });

      render(
        <TeamCard
          team={teamWithLongName}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const nameElement = screen.getByText(teamWithLongName.name);
      expect(nameElement).toHaveClass('truncate');
    });
  });
});
