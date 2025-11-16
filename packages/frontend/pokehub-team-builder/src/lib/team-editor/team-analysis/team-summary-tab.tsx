'use client';

import type {
  TeamDefensiveCoverage,
  TeamOffensiveCoverage,
} from '@pokehub/frontend/pokemon-static-data';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { Award, Shield, Target, TrendingUp } from 'lucide-react';

export interface TeamSummaryTabProps {
  summary: {
    typeDiversity: number;
    defensiveBalance: number;
    offensiveBalance: number;
    overallScore: number;
    topThreats: string[];
    topAdvantages: string[];
  };
  defensiveCoverage: TeamDefensiveCoverage;
  offensiveCoverage: TeamOffensiveCoverage;
  teamSize: number;
}

export const TeamSummaryTab = ({
  summary,
  defensiveCoverage,
  offensiveCoverage,
}: TeamSummaryTabProps) => {
  const {
    typeDiversity,
    defensiveBalance,
    offensiveBalance,
    overallScore,
    topThreats,
    topAdvantages,
  } = summary;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'Excellent';
    if (score >= 0.4) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5" />
            Overall Team Rating
          </CardTitle>
          <CardDescription>
            Composite score based on type diversity, defensive balance, and offensive
            coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {Math.round(overallScore * 100)}%
            </span>
            <span className={`text-lg font-semibold ${getScoreColor(overallScore)}`}>
              {getScoreLabel(overallScore)}
            </span>
          </div>
          <Progress value={overallScore * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Type Diversity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Type Diversity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {Math.round(typeDiversity * 100)}%
                </span>
                <TrendingUp
                  className={`h-5 w-5 ${getScoreColor(typeDiversity)}`}
                />
              </div>
              <Progress value={typeDiversity * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {offensiveCoverage.moveTypes.length} unique move types
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Defensive Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Defensive Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {Math.round(Math.min(defensiveBalance, 1) * 100)}%
                </span>
                <Shield
                  className={`h-5 w-5 ${getScoreColor(Math.min(defensiveBalance, 1))}`}
                />
              </div>
              <Progress value={Math.min(defensiveBalance, 1) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {defensiveCoverage.teamResistances.length} resistances vs{' '}
                {defensiveCoverage.teamWeaknesses.length} weaknesses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Offensive Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Offensive Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {Math.round(offensiveBalance * 100)}%
                </span>
                <Target
                  className={`h-5 w-5 ${getScoreColor(offensiveBalance)}`}
                />
              </div>
              <Progress value={offensiveBalance * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {offensiveCoverage.superEffectiveCoverage.length} types covered
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Threats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 3 Threats to Your Team</CardTitle>
          <CardDescription>
            Most common weaknesses across your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topThreats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topThreats.map((type, index) => {
                const weakness = defensiveCoverage.teamWeaknesses.find(
                  (w) => w.type === type
                );
                return (
                  <Badge
                    key={type}
                    className={`${typeColors[type as keyof typeof typeColors]} text-base`}
                  >
                    #{index + 1} {type}
                    {weakness && ` (×${weakness.count})`}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No significant threats detected.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Advantages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 3 Advantages</CardTitle>
          <CardDescription>
            Types you both resist and can hit super-effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topAdvantages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topAdvantages.map((type, index) => (
                <Badge
                  key={type}
                  className={`${typeColors[type as keyof typeof typeColors]} border border-green-500 text-base`}
                >
                  #{index + 1} {type}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No clear advantages found.</p>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {defensiveCoverage.criticalWeaknesses.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm font-medium">
                ⚠️ Critical Weakness:{' '}
                {defensiveCoverage.criticalWeaknesses.join(', ')}
              </p>
              <p className="text-sm text-muted-foreground">
                Consider adding a Pokemon that resists these types or has immunity.
              </p>
            </div>
          )}

          {offensiveCoverage.coverageGaps.length > 12 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <p className="text-sm font-medium">
                ⚠️ Poor Offensive Coverage
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;re missing super-effective coverage for{' '}
                {offensiveCoverage.coverageGaps.length} types. Consider adding diverse
                move types.
              </p>
            </div>
          )}

          {offensiveCoverage.cannotHit.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm font-medium">
                ⚠️ Cannot Hit: {offensiveCoverage.cannotHit.join(', ')}
              </p>
              <p className="text-sm text-muted-foreground">
                Add moves that can hit these types (they&apos;re immune to all your
                current moves).
              </p>
            </div>
          )}

          {defensiveCoverage.criticalWeaknesses.length === 0 &&
            offensiveCoverage.coverageGaps.length <= 6 &&
            offensiveCoverage.cannotHit.length === 0 && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                <p className="text-sm font-medium">✅ Well-Balanced Team!</p>
                <p className="text-sm text-muted-foreground">
                  Your team has good defensive coverage and offensive diversity. Keep
                  refining your move choices and EV spreads.
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};
