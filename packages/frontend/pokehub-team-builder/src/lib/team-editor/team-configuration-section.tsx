import { useTeamEditorContext } from '../context/team-editor.context';
import { useTiersStaticData } from '../hooks/useTiersStaticData';
import type { GenerationNum, Tier } from '@pkmn/dex';
import {
  getGenerationsData,
  getBattleTierInfo,
} from '@pokehub/frontend/pokemon-static-data';
import type { BattleFormat, BattleTier } from '@pokehub/frontend/pokemon-types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pokehub/frontend/shared-ui-components';
import { BarChart3, Download, Info, Save, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

export const TeamConfigurationSection = () => {
  const { singlesTiers, doublesTiers } = useTiersStaticData();

  const { teamName, generation, format, tier } = useTeamEditorContext();

  const [battleTierInfo, setBattleTierInfo] = useState(
    getBattleTierInfo(tier.value)
  );

  const [selectedFormatTiers, setSelectedFormatTiers] = useState<
    BattleTier<'Singles'>[] | BattleTier<'Doubles'>[]
  >(format.value === 'Singles' ? singlesTiers : doublesTiers);

  const handleTierChange = useCallback((val: Tier.Singles | Tier.Doubles) => {
    setBattleTierInfo(getBattleTierInfo(val));
    tier.setValue(val);
  }, []);

  const handleFormatChange = useCallback((val: BattleFormat) => {
    if (val === 'Singles') {
      setSelectedFormatTiers(singlesTiers);
      handleTierChange(singlesTiers[0].id);
    } else if (val === 'Doubles') {
      setSelectedFormatTiers(doublesTiers);
      handleTierChange(doublesTiers[0].id);
    }
    format.setValue(val);
  }, []);

  return (
    <div className="mb-8 grid gap-6 md:grid-cols-[1fr_auto]">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Team Configuration</CardTitle>
              <CardDescription>
                Set up your team format and rules
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Implement Export')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button size="sm" onClick={() => console.log('Implement Save')}>
                <Save className="mr-2 h-4 w-4" />
                Save Team
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamName.value}
                onChange={(e) => teamName.setValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="generation">Generation</Label>
              <Select
                value={generation.value.toString()}
                onValueChange={(val) =>
                  generation.setValue(parseInt(val) as GenerationNum)
                }
              >
                <SelectTrigger id="generation" className="mt-1">
                  <SelectValue placeholder="Select Generation" />
                </SelectTrigger>
                <SelectContent>
                  {getGenerationsData().map((gen) => (
                    <SelectItem key={gen.id} value={gen.id.toString()}>
                      {gen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <Select
                value={format.value}
                onValueChange={(val) => handleFormatChange(val as BattleFormat)}
              >
                <SelectTrigger id="format" className="mt-1">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Singles">Singles</SelectItem>
                  <SelectItem value="Doubles">Doubles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={tier.value}
                onValueChange={(val) =>
                  handleTierChange(val as Tier.Singles | Tier.Doubles)
                }
              >
                <SelectTrigger id="tier" className="mt-1">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFormatTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Format and Tier descriptions */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {format && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{format.value}</AlertTitle>
                <AlertDescription>
                  {format.value === 'Singles'
                    ? 'Standard 1v1 battles where each trainer brings 6 Pokémon and sends out 1 at a time.'
                    : 'Doubles battles where each trainer brings 4-6 Pokémon and sends out 2 at a time.'}
                </AlertDescription>
              </Alert>
            )}
            {tier.value && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{battleTierInfo?.name}</AlertTitle>
                <AlertDescription>
                  {battleTierInfo?.description}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Team Analysis</CardTitle>
          <CardDescription>
            {"Check your team's strengths and weaknesses"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <Button
            variant="outline"
            className="w-full"
            onClick={
              () => console.log('TODO') /*() => setIsTeamAnalysisOpen(true)*/
            }
            disabled={false /*team.every((p) => p === null)*/}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
