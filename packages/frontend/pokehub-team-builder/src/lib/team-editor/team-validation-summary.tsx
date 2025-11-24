import type { TeamValidationState } from '../context/team-editor.context.model';
import {
  getTeamLevelErrors,
  getPokemonSlotErrors,
} from '@pokehub/shared/pokemon-types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface TeamValidationSummaryProps {
  validationResult: TeamValidationState;
  pokemonNames: string[]; // Array of Pokemon names
}

export const TeamValidationSummary = ({
  validationResult,
  pokemonNames,
}: TeamValidationSummaryProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const teamErrors = getTeamLevelErrors(validationResult);
  const pokemonErrors = Array.from({ length: pokemonNames.length }, (_, i) =>
    getPokemonSlotErrors(validationResult, i)
  );

  // Count total errors
  const totalErrors =
    teamErrors.length +
    pokemonErrors.reduce((sum, errors) => sum + errors.length, 0);

  // Success state - team is valid
  if (validationResult.isValid) {
    return (
      <Alert variant="default" className="mb-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Team Valid
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your team passes all validation rules and is ready to save.
        </AlertDescription>
      </Alert>
    );
  }

  // Error state - show validation errors
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              Validation Errors
              <Badge variant="destructive" className="text-xs">
                {totalErrors} {totalErrors === 1 ? 'error' : 'errors'}
              </Badge>
            </AlertTitle>
          </div>
          <CollapsibleTrigger className="ml-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <AlertDescription>
            <div className="mt-2 space-y-3">
              {/* Team-level errors */}
              {teamErrors.length > 0 && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                    Format Rule Violations
                    <Badge variant="outline" className="text-xs">
                      {teamErrors.length}
                    </Badge>
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {teamErrors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span>{error.message}</span>
                      </li>
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
                  <div key={index} className="rounded-md bg-destructive/10 p-3">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                      {displayName}
                      <Badge variant="outline" className="text-xs">
                        {errors.length}
                      </Badge>
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {errors.map((error, errorIndex) => (
                        <li key={errorIndex} className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">•</span>
                          <span>{error.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </AlertDescription>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
};
