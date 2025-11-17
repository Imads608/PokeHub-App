export { getGenerationsData } from './lib/generation-details';
export type { GenerationDetails } from './lib/generation-details';
export {
  getTypeEffectiveness,
  getTypeEffectivenessForTypes,
  getOffensiveTypeEffectiveness,
  getCombinedOffensiveCoverage,
  getCoverageGaps,
} from './lib/type-effectiveness';
export {
  getSinglesBattleTiers,
  getDoublesBattleTiers,
  getBattleTiersForFormat,
  getDoublesBattleTierHierarchy,
  getSinglesBattleTierHierarchy,
  getBattleTierInfo,
} from './lib/battle-tiers';
export {
  calculateTeamDefensiveCoverage,
  calculateTeamOffensiveCoverage,
  getTeamAnalysisSummary,
} from './lib/team-type-coverage';
export type {
  TeamDefensiveCoverage,
  TeamOffensiveCoverage,
  MoveForCoverage,
} from './lib/team-type-coverage';
