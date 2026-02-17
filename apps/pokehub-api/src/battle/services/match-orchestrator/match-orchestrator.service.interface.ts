export const MATCH_ORCHESTRATOR_SERVICE = 'MATCH_ORCHESTRATOR_SERVICE';

export interface IMatchOrchestratorService {
  /** Try to find and create a match for a format */
  tryFindMatch(format: string): Promise<void>;

  /** Handle a player declining a matched battle */
  declineMatch(userId: string, battleId: string): Promise<void>;
}
