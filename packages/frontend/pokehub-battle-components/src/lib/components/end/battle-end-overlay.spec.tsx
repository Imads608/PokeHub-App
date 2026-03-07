import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BattleEndOverlay } from './battle-end-overlay';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('BattleEndOverlay', () => {
  const defaultProps = {
    winner: null,
    myUserId: 'u1',
    endReason: null as never,
    canSaveReplay: false,
    replaySaved: false,
    onSaveReplay: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Victory when user is the winner', () => {
    render(<BattleEndOverlay {...defaultProps} winner="u1" endReason="win" />);
    expect(screen.getByText('Victory!')).toBeTruthy();
  });

  it('renders Defeat when user is the loser', () => {
    render(<BattleEndOverlay {...defaultProps} winner="u2" endReason="win" />);
    expect(screen.getByText('Defeat')).toBeTruthy();
  });

  it('renders Draw when winner is null and reason is draw', () => {
    render(<BattleEndOverlay {...defaultProps} winner={null} endReason="draw" />);
    expect(screen.getByText('Draw!')).toBeTruthy();
  });

  it('shows Save Replay button when canSaveReplay is true', () => {
    render(
      <BattleEndOverlay
        {...defaultProps}
        winner="u1"
        endReason="win"
        canSaveReplay={true}
      />
    );
    expect(screen.getByText('Save Replay')).toBeTruthy();
  });

  it('shows "Replay Saved" and disables button when replaySaved is true', () => {
    render(
      <BattleEndOverlay
        {...defaultProps}
        winner="u1"
        endReason="win"
        canSaveReplay={true}
        replaySaved={true}
      />
    );
    const btn = screen.getByText('Replay Saved').closest('button');
    expect(btn?.disabled).toBe(true);
  });

  it('calls onSaveReplay when Save Replay is clicked', async () => {
    const onSaveReplay = jest.fn();
    render(
      <BattleEndOverlay
        {...defaultProps}
        winner="u1"
        endReason="win"
        canSaveReplay={true}
        onSaveReplay={onSaveReplay}
      />
    );

    await userEvent.click(screen.getByText('Save Replay'));
    expect(onSaveReplay).toHaveBeenCalledTimes(1);
  });

  it('navigates to /battle when "Find New Battle" is clicked', async () => {
    render(<BattleEndOverlay {...defaultProps} winner="u1" endReason="win" />);

    await userEvent.click(screen.getByText('Find New Battle'));
    expect(mockPush).toHaveBeenCalledWith('/battle');
  });

  it('navigates to / when "Exit" is clicked', async () => {
    render(<BattleEndOverlay {...defaultProps} winner="u1" endReason="win" />);

    await userEvent.click(screen.getByText('Exit'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('displays end reason text for non-standard reasons', () => {
    render(
      <BattleEndOverlay {...defaultProps} winner="u2" endReason="opponent_forfeit" />
    );
    expect(screen.getByText('opponent forfeit')).toBeTruthy();
  });

  it('does not display end reason for "win" or "draw"', () => {
    render(<BattleEndOverlay {...defaultProps} winner="u1" endReason="win" />);
    expect(screen.queryByText('win')).toBeNull();
  });
});
