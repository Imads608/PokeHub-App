'use client';

import type { TeamOffensiveCoverage } from '@pokehub/frontend/pokemon-static-data';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { AlertTriangle, Target, Zap } from 'lucide-react';

export interface OffensiveCoverageTabProps {
  coverage: TeamOffensiveCoverage;
  teamSize: number;
}

export const OffensiveCoverageTab = ({
  coverage,
  teamSize,
}: OffensiveCoverageTabProps) => {
  const {
    moveTypes,
    superEffectiveCoverage,
    coverageGaps,
    resistedBy,
    cannotHit,
  } = coverage;

  const hasCriticalGaps = coverageGaps.length > 10; // More than 10 types not covered
  const hasImportantGaps = cannotHit.length > 0; // Types with immunity

  return (
    <div className="space-y-4">
      {/* Coverage Gaps Alert */}
      {(hasCriticalGaps || hasImportantGaps) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Coverage Gaps Detected!</AlertTitle>
          <AlertDescription>
            {hasImportantGaps &&
              `Your team cannot hit ${cannotHit.length} type(s) at all. `}
            {hasCriticalGaps &&
              `You lack super-effective coverage against ${coverageGaps.length} types.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Move Types Available */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Move Types on Team
          </CardTitle>
          <CardDescription>
            All attacking move types across your {teamSize} Pokemon
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moveTypes.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {moveTypes.map(
                  ({ type, count, physicalCount, specialCount, statusCount }) => (
                    <div key={type} className="flex flex-col items-start gap-1">
                      <Badge className={typeColors[type]}>
                        {type} ×{count}
                      </Badge>
                      <div className="flex gap-1 text-xs text-muted-foreground">
                        {physicalCount > 0 && (
                          <span className="rounded bg-orange-100 px-1 dark:bg-orange-900/30">
                            P:{physicalCount}
                          </span>
                        )}
                        {specialCount > 0 && (
                          <span className="rounded bg-blue-100 px-1 dark:bg-blue-900/30">
                            S:{specialCount}
                          </span>
                        )}
                        {statusCount > 0 && (
                          <span className="rounded bg-purple-100 px-1 dark:bg-purple-900/30">
                            St:{statusCount}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Legend:</span> P=Physical, S=Special,
                St=Status
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No moves found on your team. Add moves to your Pokemon to see coverage
              analysis.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Super Effective Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-green-500" />
            Super Effective Coverage
          </CardTitle>
          <CardDescription>
            Types your team can hit for super-effective damage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {superEffectiveCoverage.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {superEffectiveCoverage.map((type) => (
                  <Badge
                    key={type}
                    className={`${typeColors[type]} border border-green-500`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Covering {superEffectiveCoverage.length} out of 18 types (
                {Math.round((superEffectiveCoverage.length / 18) * 100)}%)
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No super-effective coverage. Add attacking moves to your team.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Coverage Gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Coverage Gaps
          </CardTitle>
          <CardDescription>
            Types you cannot hit super-effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coverageGaps.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {coverageGaps.map((type) => (
                  <Badge
                    key={type}
                    className={`${typeColors[type]} border border-yellow-500 opacity-70`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Missing super-effective coverage for {coverageGaps.length} types
              </p>
            </div>
          ) : (
            <p className="text-sm text-green-600 dark:text-green-400">
              Perfect coverage! You can hit all types super-effectively.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Types You Cannot Hit */}
      {cannotHit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Types You Cannot Hit
            </CardTitle>
            <CardDescription>
              Types immune to all your move types (no damage)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cannotHit.map((type) => (
                <Badge
                  key={type}
                  className={`${typeColors[type]} border-2 border-destructive opacity-50`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Types That Resist Your Moves */}
      {resistedBy.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resistant Types</CardTitle>
            <CardDescription>
              Types that resist your attacks (0.5× or 0.25× damage) and you cannot hit
              super-effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {resistedBy.map((type) => (
                  <Badge key={type} className={`${typeColors[type]} opacity-60`}>
                    {type}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {resistedBy.length} type(s) resist your attacks without super-effective
                coverage
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
