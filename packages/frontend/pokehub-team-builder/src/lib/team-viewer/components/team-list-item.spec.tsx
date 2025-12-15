import {
  createMockTeam,
  createMockPokemon,
} from '../../../test-utils/team-viewer-test-utils';
import { TeamListItem } from './team-list-item';
import type { GenerationNum } from '@pkmn/dex';
import { render, screen } from '@testing-library/react';
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
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe('TeamListItem', () => {
  const mockTeam = createMockTeam({
    id: 'team-456',
    name: 'My VGC Team',
    generation: 9 as GenerationNum,
    format: 'vgc2024rege',
    pokemon: [
      createMockPokemon({ species: 'Flutter Mane' }),
      createMockPokemon({ species: 'Raging Bolt' }),
      createMockPokemon({ species: 'Urshifu' }),
    ],
    updatedAt: new Date('2024-01-20T00:00:00.000Z'),
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
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('My VGC Team')).toBeInTheDocument();
    });

    it('should display format badge', () => {
      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('VGC 2024 Reg E')).toBeInTheDocument();
    });

    it('should display "Updated" timestamp', () => {
      render(
        <TeamListItem
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
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const sprites = container.querySelectorAll('span[style]');
      expect(sprites.length).toBeGreaterThanOrEqual(3);
    });

    it('should link to team editor', () => {
      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/team-builder/team-456');
    });
  });

  describe('action buttons', () => {
    it('should render Edit button', () => {
      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should render Duplicate button', () => {
      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(
        screen.getByRole('button', { name: /duplicate/i })
      ).toBeInTheDocument();
    });

    it('should render Delete button', () => {
      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument();
    });

    it('should call onEdit with team ID when Edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('team-456');
    });

    it('should call onDuplicate with team when Duplicate button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const duplicateButton = screen.getByRole('button', {
        name: /duplicate/i,
      });
      await user.click(duplicateButton);

      expect(mockOnDuplicate).toHaveBeenCalledWith(mockTeam);
    });

    it('should call onDelete with team when Delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamListItem
          team={mockTeam}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockTeam);
    });
  });

  describe('edge cases', () => {
    it('should handle team with single Pokemon', () => {
      const teamWithOnePokemon = createMockTeam({
        pokemon: [createMockPokemon({ species: 'Pikachu' })],
      });

      const { container } = render(
        <TeamListItem
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
        <TeamListItem
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
        <TeamListItem
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
        name: 'This is a very long team name that should be truncated',
      });

      render(
        <TeamListItem
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
