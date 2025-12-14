import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
  SpeciesName,
} from '@pkmn/dex';
import {
  getAbilityDetails,
  getItemDetails,
  getMoveDetails,
  getPokemonDetailsByName,
  getFormatRules,
} from '@pokehub/frontend/dex-data-provider';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { Ban, Shield, Swords, Zap, Package, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface FormatRulesDisplayProps {
  showdownFormatId: string;
  generation: GenerationNum;
}

interface CategorizedBans {
  pokemon: SpeciesName[];
  moves: MoveName[];
  abilities: AbilityName[];
  items: ItemName[];
  other: string[];
}

export const FormatRulesDisplay = ({
  showdownFormatId,
  generation,
}: FormatRulesDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Categorize bans by type
  const categorizedBans = useMemo<CategorizedBans>(() => {
    const formatRules = getFormatRules(showdownFormatId);
    if (!formatRules) {
      return { pokemon: [], moves: [], abilities: [], items: [], other: [] };
    }

    const result: CategorizedBans = {
      pokemon: [],
      moves: [],
      abilities: [],
      items: [],
      other: [],
    };

    formatRules.banlist.forEach((ban) => {
      // Check if it's a Pokemon
      const pokemonDetails = getPokemonDetailsByName(
        ban as SpeciesName,
        generation
      );
      if (pokemonDetails) {
        result.pokemon.push(ban as SpeciesName);
        return;
      }

      // Check if it's a move
      const moveDetails = getMoveDetails(ban as MoveName, generation);
      if (moveDetails && moveDetails.exists) {
        result.moves.push(ban as MoveName);
        return;
      }

      // Check if it's an ability
      const abilityDetails = getAbilityDetails(ban as AbilityName, generation);
      if (abilityDetails) {
        result.abilities.push(ban as AbilityName);
        return;
      }

      // Check if it's an item
      const itemDetails = getItemDetails(ban as ItemName, generation);
      if (itemDetails) {
        result.items.push(ban as ItemName);
        return;
      }

      // Otherwise, it's a tier marker or other rule
      result.other.push(ban);
    });

    return result;
  }, [showdownFormatId, generation]);

  const formatRules = getFormatRules(showdownFormatId);

  if (!formatRules || formatRules.banlist.length === 0) {
    return (
      <Card data-testid="format-rules-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Format Rules
          </CardTitle>
          <CardDescription>
            No specific bans for this format - all Pokemon, moves, abilities,
            and items are allowed
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalBans =
    categorizedBans.pokemon.length +
    categorizedBans.moves.length +
    categorizedBans.abilities.length +
    categorizedBans.items.length +
    categorizedBans.other.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card data-testid="format-rules-card">
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 [&[data-state=open]>svg]:rotate-180">
            <div className="flex flex-col items-start gap-1.5">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Format Rules
              </CardTitle>
              <CardDescription>
                {totalBans} restriction{totalBans !== 1 ? 's' : ''} for{' '}
                {formatRules.formatName}
              </CardDescription>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Banned Tiers/Other */}
            {categorizedBans.other.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Ban className="h-4 w-4" />
                  Banned Tiers ({categorizedBans.other.length})
                </h4>
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-1 pr-4">
                    {categorizedBans.other.map((ban) => (
                      <Badge
                        key={ban}
                        variant="destructive"
                        className="text-xs"
                      >
                        {ban}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Banned Pokemon */}
            {categorizedBans.pokemon.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Ban className="h-4 w-4" />
                  Banned Pokemon ({categorizedBans.pokemon.length})
                </h4>
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-1 pr-4">
                    {categorizedBans.pokemon.map((ban) => (
                      <Badge key={ban} variant="outline" className="text-xs">
                        {ban}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Banned Moves */}
            {categorizedBans.moves.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Swords className="h-4 w-4" />
                  Banned Moves ({categorizedBans.moves.length})
                </h4>
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-1 pr-4">
                    {categorizedBans.moves.map((ban) => (
                      <Badge key={ban} variant="outline" className="text-xs">
                        {ban}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Banned Abilities */}
            {categorizedBans.abilities.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4" />
                  Banned Abilities ({categorizedBans.abilities.length})
                </h4>
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-1 pr-4">
                    {categorizedBans.abilities.map((ban) => (
                      <Badge key={ban} variant="outline" className="text-xs">
                        {ban}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Banned Items */}
            {categorizedBans.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4" />
                  Banned Items ({categorizedBans.items.length})
                </h4>
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-1 pr-4">
                    {categorizedBans.items.map((ban) => (
                      <Badge key={ban} variant="outline" className="text-xs">
                        {ban}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
