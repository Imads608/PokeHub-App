import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { validateTeamForFormat } from '@pokehub/shared/pokemon-showdown-validation';
import type { CreateTeamDTO, PokemonTeam } from '@pokehub/shared/pokemon-types';

/**
 * Validates team data against Pokemon Showdown format rules.
 *
 * This pipe should run AFTER ZodValidationPipe to ensure structural validity.
 * It validates:
 * - Species legality for the format
 * - Move legality (learnset, bans)
 * - Ability legality
 * - Item legality
 * - Team composition rules (clauses, restrictions)
 */
@Injectable()
export class ShowdownTeamValidationPipe
  implements PipeTransform<CreateTeamDTO, CreateTeamDTO>
{
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(ShowdownTeamValidationPipe.name);
  }

  transform(value: CreateTeamDTO): CreateTeamDTO {
    this.logger.log(
      `Validating team for generation ${value.generation} and format ${value.format}`
    );

    // Construct full Showdown format ID
    const formatId = `gen${value.generation}${value.format}`;

    // Cast to PokemonTeam - Zod ensures structure, Showdown validates content
    const result = validateTeamForFormat(
      value as unknown as PokemonTeam,
      formatId
    );

    if (!result.isValid) {
      this.logger.warn(`Team validation failed for format ${formatId}`);
      throw new BadRequestException({
        message: 'Team validation failed',
        formatId,
        errors: result.errors,
        pokemonErrors: this.formatPokemonErrors(result.pokemonResults),
      });
    }

    this.logger.log(`Team validation passed for format ${formatId}`);

    return value;
  }

  private formatPokemonErrors(
    pokemonResults: Map<number, { isValid: boolean; errors: string[] }>
  ): Record<number, string[]> {
    const errors: Record<number, string[]> = {};

    pokemonResults.forEach((result, slot) => {
      if (!result.isValid && result.errors.length > 0) {
        errors[slot] = result.errors;
      }
    });

    return errors;
  }
}
