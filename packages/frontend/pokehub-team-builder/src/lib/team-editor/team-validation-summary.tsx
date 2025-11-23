import type { ValidationResult } from '@pokehub/shared/pokemon-types';
import {
  getTeamLevelErrors,
  getPokemonSlotErrors,
} from '@pokehub/shared/pokemon-types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@pokehub/frontend/shared-ui-components';
import { AlertCircle } from 'lucide-react';

export interface TeamValidationSummaryProps {
  validationResult: ValidationResult;
  pokemonNames: string[]; // Array of Pokemon names
}

export const TeamValidationSummary = ({
  validationResult,
  pokemonNames,
}: TeamValidationSummaryProps) => {
  if (validationResult.isValid) {
    return null;
  }

  const teamErrors = getTeamLevelErrors(validationResult);
  const pokemonErrors = Array.from({ length: pokemonNames.length }, (_, i) =>
    getPokemonSlotErrors(validationResult, i)
  );

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Cannot Save Team - Validation Errors</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {/* Team-level errors */}
          {teamErrors.length > 0 && (
            <div>
              <p className="font-medium text-sm">Team:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {teamErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pokemon-specific errors */}
          {pokemonErrors.map((errors, index) => {
            if (errors.length === 0) return null;

            const pokemonName = pokemonNames[index];
            const displayName = pokemonName || `Pokemon ${index + 1}`;

            return (
              <div key={index}>
                <p className="font-medium text-sm">{displayName}:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((error, errorIndex) => (
                    <li key={errorIndex}>{error.message}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </AlertDescription>
    </Alert>
  );
};
