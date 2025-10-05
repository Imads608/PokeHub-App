import { TypeName } from "@pkmn/dex";
import { useQuery } from "@tanstack/react-query";

export const usePokemonTypesEffectiveness = (types: TypeName[]) => {
  return useQuery({
    queryKey: ["types", "effectiveness", types],
    queryFn: () => {
       re	
    }
  })
}jkkj
