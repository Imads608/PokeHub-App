import { usePokemonDexDetailsContext } from '../../context/pokemon-dex-details.context';
import { usePokemonEvolutionLine } from '../../hooks/usePokemonEvolutionLine';
import { PokemonEvoTree } from './pokemon-evo-tree';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TabsContent,
} from '@pokehub/frontend/shared-ui-components';
import { isBaseForme } from '@pokehub/frontend/shared-utils';

export const PokemonEvoTab = () => {
  const { species, selectedForm, selectedGeneration } =
    usePokemonDexDetailsContext();
  const { data: evolutions } = usePokemonEvolutionLine(
    selectedForm.pokemon.value && isBaseForme(selectedForm.pokemon.value)
      ? selectedForm.pokemon.value
      : species.value,
    { generation: selectedGeneration.value }
  );

  return (
    <TabsContent value="evolution" className="mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Evolution Chain</CardTitle>
            <CardDescription>
              How this Pokémon evolves and its special forms
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* New Evolution Tree Component */}
          {evolutions && <PokemonEvoTree evolutionChain={evolutions} />}

          {/* Special Forms */}
          {/* {showAllForms && */}
          {/*   pokemon.specialForms && */}
          {/*   pokemon.specialForms.length > 0 && ( */}
          {/*     <div className="mt-8"> */}
          {/*       <Separator className="mb-6" /> */}
          {/*       <h3 className="mb-4 text-lg font-medium">Special Forms</h3> */}
          {/**/}
          {/*       {/* Group forms by type */}
          {/*       {['mega', 'gigantamax', 'regional', 'primal', 'alternate'].map( */}
          {/*         (formType) => { */}
          {/*           const formsOfType = pokemon.specialForms.filter( */}
          {/*             (form) => form.formType === formType */}
          {/*           ); */}
          {/**/}
          {/*           if (formsOfType.length === 0) return null; */}
          {/**/}
          {/*           return ( */}
          {/*             <div key={formType} className="mb-8"> */}
          {/*               <h4 className="mb-3 flex items-center gap-2 text-base font-medium capitalize"> */}
          {/*                 {getFormTypeIcon(formType as SpecialFormType)} */}
          {/*                 {formType === 'gigantamax' */}
          {/*                   ? 'Gigantamax' */}
          {/*                   : formType === 'mega' */}
          {/*                   ? 'Mega Evolution' */}
          {/*                   : formType === 'regional' */}
          {/*                   ? 'Regional Forms' */}
          {/*                   : formType === 'primal' */}
          {/*                   ? 'Primal Reversion' */}
          {/*                   : 'Alternate Forms'} */}
          {/*               </h4> */}
          {/**/}
          {/*               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"> */}
          {/*                 {formsOfType.map((form, idx) => ( */}
          {/*                   <div */}
          {/*                     key={idx} */}
          {/*                     className="flex flex-col items-center rounded-lg border p-4" */}
          {/*                   > */}
          {/*                     <div className="mb-2 rounded-full bg-muted p-3"> */}
          {/*                       <img */}
          {/*                         src={form.image || '/placeholder.svg'} */}
          {/*                         alt={form.name} */}
          {/*                         className="h-20 w-20 object-contain" */}
          {/*                       /> */}
          {/*                     </div> */}
          {/*                     <div className="text-center"> */}
          {/*                       <p className="font-medium">{form.name}</p> */}
          {/*                       <div className="mt-1 flex justify-center gap-1"> */}
          {/*                         {form.types.map((type) => ( */}
          {/*                           <Badge */}
          {/*                             key={type} */}
          {/*                             className={`${ */}
          {/*                               typeColors[ */}
          {/*                                 type as keyof typeof typeColors */}
          {/*                               ] */}
          {/*                             } text-xs capitalize`} */}
          {/*                           > */}
          {/*                             {type} */}
          {/*                           </Badge> */}
          {/*                         ))} */}
          {/*                       </div> */}
          {/*                       <Badge */}
          {/*                         className={`mt-2 ${getFormTypeBadgeColor( */}
          {/*                           form.formType */}
          {/*                         )} flex items-center gap-1`} */}
          {/*                       > */}
          {/*                         {getFormTypeIcon(form.formType)} */}
          {/*                         <span className="capitalize"> */}
          {/*                           {form.formType} */}
          {/*                         </span> */}
          {/*                       </Badge> */}
          {/*                       <p className="mt-2 text-xs text-muted-foreground"> */}
          {/*                         {form.description} */}
          {/*                       </p> */}
          {/*                       {showChanges && ( */}
          {/*                         <Badge */}
          {/*                           variant="outline" */}
          {/*                           className="mt-2 text-xs" */}
          {/*                         > */}
          {/*                           Introduced in Gen {form.generation} */}
          {/*                         </Badge> */}
          {/*                       )} */}
          {/*                     </div> */}
          {/*                   </div> */}
          {/*                 ))} */}
          {/*               </div> */}
          {/*             </div> */}
          {/*           ); */}
          {/*         } */}
          {/*       )} */}
          {/*     </div> */}
          {/*   )} */}

          {/* No Special Forms Message */}
          {/* {showAllForms && */}
          {/*   (!pokemon.specialForms || pokemon.specialForms.length === 0) && ( */}
          {/*     <div className="mt-8"> */}
          {/*       <Separator className="mb-6" /> */}
          {/*       <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8"> */}
          {/*         <div className="mb-4 rounded-full bg-muted p-3"> */}
          {/*           <Info className="h-6 w-6 text-muted-foreground" /> */}
          {/*         </div> */}
          {/*         <h3 className="mb-1 text-lg font-medium">No Special Forms</h3> */}
          {/*         <p className="text-center text-muted-foreground"> */}
          {/*           This Pokémon doesn't have any Mega Evolutions, Gigantamax */}
          {/*           forms, or other special forms */}
          {/*           {pokemon.isHistoricalView */}
          {/*             ? ` in ${generationData[selectedGeneration - 1].name}` */}
          {/*             : ''} */}
          {/*           . */}
          {/*         </p> */}
          {/*       </div> */}
          {/*     </div> */}
          {/*   )} */}
        </CardContent>
      </Card>
    </TabsContent>
  );
};
