import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionPanel } from './action-panel';

// Mock child components to isolate ActionPanel logic
jest.mock('./move-panel', () => ({
  MovePanel: () => <div data-testid="move-panel" />,
}));
jest.mock('./switch-panel', () => ({
  SwitchPanel: () => <div data-testid="switch-panel" />,
}));
jest.mock('./mechanic-toggle', () => ({
  MechanicToggle: () => null,
}));

function makeBattle(request = null) {
  return { request } as never;
}

const noop = () => {
  /* no-op */
};

describe('ActionPanel', () => {
  const defaultProps = {
    opponentPokemon: null,
    pendingChoice: null,
    onMoveSelect: noop,
    onSwitchSelect: noop,
    onTeamSelect: noop,
    onCancelChoice: noop,
  };

  it('renders "Waiting for opponent..." when no request', () => {
    render(<ActionPanel battle={makeBattle()} {...defaultProps} />);
    expect(screen.getByText('Waiting for opponent...')).toBeTruthy();
  });

  it('renders "Waiting for opponent..." for wait request', () => {
    render(
      <ActionPanel
        battle={makeBattle({ requestType: 'wait' })}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Waiting for opponent...')).toBeTruthy();
  });

  it('renders Moves and Switch tabs for move request', () => {
    const request = {
      requestType: 'move',
      active: [{ moves: [], trapped: false, maybeTrapped: false }],
      side: { pokemon: [] },
    };
    render(
      <ActionPanel battle={makeBattle(request)} {...defaultProps} />
    );
    expect(screen.getByText('Moves')).toBeTruthy();
    expect(screen.getByText('Switch')).toBeTruthy();
  });

  it('disables Switch tab when trapped', () => {
    const request = {
      requestType: 'move',
      active: [{ moves: [], trapped: true, maybeTrapped: false }],
      side: { pokemon: [] },
    };
    render(
      <ActionPanel battle={makeBattle(request)} {...defaultProps} />
    );
    const switchTab = screen.getByRole('tab', { name: /switch/i });
    expect(switchTab.getAttribute('data-disabled')).toBe('');
  });

  it('shows choice label and "Change Move" button with pendingChoice', () => {
    const request = {
      requestType: 'move',
      active: [{ moves: [{ name: 'Thunderbolt' }] }],
      side: { pokemon: [] },
    };
    render(
      <ActionPanel
        battle={makeBattle(request)}
        {...defaultProps}
        pendingChoice="move 1"
      />
    );
    expect(screen.getByText('Thunderbolt')).toBeTruthy();
    expect(screen.getByText('Change Move')).toBeTruthy();
  });

  it('calls onCancelChoice when "Change Move" is clicked', async () => {
    const onCancelChoice = jest.fn();
    const request = {
      requestType: 'move',
      active: [{ moves: [{ name: 'Thunderbolt' }] }],
      side: { pokemon: [] },
    };
    render(
      <ActionPanel
        battle={makeBattle(request)}
        {...defaultProps}
        pendingChoice="move 1"
        onCancelChoice={onCancelChoice}
      />
    );

    await userEvent.click(screen.getByText('Change Move'));
    expect(onCancelChoice).toHaveBeenCalledTimes(1);
  });

  it('renders team preview with "Choose your lead Pokemon"', () => {
    const request = {
      requestType: 'team',
      side: {
        pokemon: [
          { ident: 'p1: Pikachu', details: 'Pikachu, L50, M' },
          { ident: 'p1: Charizard', details: 'Charizard, L50, M' },
        ],
      },
    };
    render(
      <ActionPanel battle={makeBattle(request)} {...defaultProps} />
    );
    expect(screen.getByText('Choose your lead Pokemon')).toBeTruthy();
    expect(screen.getByText('Pikachu')).toBeTruthy();
    expect(screen.getByText('Charizard')).toBeTruthy();
  });

  it('renders force-switch with "Choose a Pokemon to switch in"', () => {
    const request = {
      requestType: 'switch',
      side: { pokemon: [] },
    };
    render(
      <ActionPanel battle={makeBattle(request)} {...defaultProps} />
    );
    expect(screen.getByText('Choose a Pokemon to switch in')).toBeTruthy();
  });
});
