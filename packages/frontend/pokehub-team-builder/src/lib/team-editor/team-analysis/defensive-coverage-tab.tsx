'use client';

import type { TeamDefensiveCoverage } from './team-type-coverage';
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
import { AlertTriangle, Shield, Swords } from 'lucide-react';

export interface DefensiveCoverageTabProps {
  coverage: TeamDefensiveCoverage;
  teamSize: number;
}

export const DefensiveCoverageTab = ({
  coverage,
  teamSize,
}: DefensiveCoverageTabProps) => {
  const {
    criticalWeaknesses,
    sharedWeaknesses,
    teamWeaknesses,
    teamResistances,
    teamImmunities,
  } = coverage;

  const hasCriticalWeaknesses = criticalWeaknesses.length > 0;
  const hasSharedWeaknesses = sharedWeaknesses.length > 0;

  // Calculate thresholds for display
  const criticalThreshold = Math.max(1, Math.floor(teamSize * 0.8));
  const criticalPercentage = Math.round((criticalThreshold / teamSize) * 100);
  const sharedThreshold = Math.max(1, Math.floor(teamSize * 0.5));

  return (
    <div className="space-y-4">
      {/* Critical Weaknesses Alert */}
      {hasCriticalWeaknesses && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Weaknesses Detected!</AlertTitle>
          <AlertDescription>
            The following types hit {criticalPercentage}% of your Pokemon (
            {criticalThreshold} of {teamSize}). Consider adding a Pokemon that
            resists these types.
          </AlertDescription>
        </Alert>
      )}

      {/* Critical Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5 text-destructive" />
            Critical Weaknesses
          </CardTitle>
          <CardDescription>
            Types that hit {criticalPercentage}% or more of your team (
            {criticalThreshold}+ of {teamSize} Pokemon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasCriticalWeaknesses ? (
            <div className="flex flex-wrap gap-2">
              {teamWeaknesses
                .filter((w) => criticalWeaknesses.includes(w.type))
                .map(({ type, count }) => (
                  <Badge
                    key={type}
                    className={`${typeColors[type]} border-2 border-destructive`}
                  >
                    {type} ×{count}
                  </Badge>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No critical weaknesses! Your team has good defensive diversity.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shared Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Shared Weaknesses
          </CardTitle>
          <CardDescription>
            Types that hit multiple Pokemon ({sharedThreshold}-
            {criticalThreshold - 1} of {teamSize} Pokemon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSharedWeaknesses ? (
            <div className="flex flex-wrap gap-2">
              {teamWeaknesses
                .filter((w) => sharedWeaknesses.includes(w.type))
                .map(({ type, count }) => (
                  <Badge
                    key={type}
                    className={`${typeColors[type]} border border-yellow-500`}
                  >
                    {type} ×{count}
                  </Badge>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No shared weaknesses across multiple Pokemon.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Team Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Team Weaknesses</CardTitle>
          <CardDescription>
            Complete breakdown of types your team is weak to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamWeaknesses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teamWeaknesses.map(({ type, count }) => (
                <Badge key={type} className={typeColors[type]}>
                  {type} ×{count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No weaknesses detected (this is unusual - check your team
              composition).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Resistances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-green-500" />
            Team Resistances
          </CardTitle>
          <CardDescription>
            Types that multiple Pokemon resist (take reduced damage)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamResistances.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teamResistances.map(({ type, count }) => (
                <Badge
                  key={type}
                  className={`${typeColors[type]} border border-green-500`}
                >
                  {type} ×{count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No resistances found. Your team may lack defensive synergy.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Immunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-500" />
            Team Immunities
          </CardTitle>
          <CardDescription>
            Types that one or more Pokemon are immune to (no damage)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamImmunities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teamImmunities.map(({ type, count }) => (
                <Badge
                  key={type}
                  className={`${typeColors[type]} border-2 border-blue-500`}
                >
                  {type} ×{count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No immunities on your team.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
