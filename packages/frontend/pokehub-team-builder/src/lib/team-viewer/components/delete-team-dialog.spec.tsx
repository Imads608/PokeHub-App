import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteTeamDialog } from './delete-team-dialog';
import { createMockTeam } from '../../../test-utils/team-viewer-test-utils';

describe('DeleteTeamDialog', () => {
  const mockTeam = createMockTeam({ name: 'My Awesome Team' });
  const mockOnOpenChange = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when open', () => {
    it('should render dialog title', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByRole('heading', { name: /delete team/i })).toBeInTheDocument();
    });

    it('should display team name in warning message', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByText('My Awesome Team')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render Delete button', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('when closed', () => {
    it('should not render dialog content', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={false}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      expect(screen.queryByRole('heading', { name: /delete team/i })).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onOpenChange with false when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onConfirm when Delete is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  describe('when isDeleting is true', () => {
    it('should disable Cancel button', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={true}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should disable Delete button', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={true}
        />
      );

      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    });

    it('should show "Deleting..." text on Delete button', () => {
      render(
        <DeleteTeamDialog
          team={mockTeam}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={true}
        />
      );

      expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null team gracefully', () => {
      render(
        <DeleteTeamDialog
          team={null}
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });
  });
});
