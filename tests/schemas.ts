import { z } from 'zod';

export const NamedAPIResource = z.object({
  name: z.string(),
  url: z.string().url()
});

export const PokemonAbility = z.object({
  ability: NamedAPIResource,
  is_hidden: z.boolean(),
  slot: z.number().int().positive()
});

export const PokemonSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  height: z.number().int().nonnegative(),
  weight: z.number().int().nonnegative(),
  abilities: z.array(PokemonAbility).nonempty(),
  species: NamedAPIResource,
  sprites: z.object({ front_default: z.string().url().nullable() }).partial()
});

export const PaginatedList = z.object({
  count: z.number().int().nonnegative(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(NamedAPIResource)
});

export const TypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  damage_relations: z.object({
    double_damage_from: z.array(NamedAPIResource),
    double_damage_to: z.array(NamedAPIResource),
    half_damage_from: z.array(NamedAPIResource),
    half_damage_to: z.array(NamedAPIResource),
    no_damage_from: z.array(NamedAPIResource),
    no_damage_to: z.array(NamedAPIResource)
  })
});

export type Pokemon = z.infer<typeof PokemonSchema>;
