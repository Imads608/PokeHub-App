import type { TypeName } from '@pkmn/dex';
import { PokemonTypeBadge } from '@pokehub/frontend/pokehub-ui-components';
import {
  FEATURED_POKEMON,
  type FeaturedPokemon,
} from '@pokehub/frontend/pokemon-static-data';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@pokehub/frontend/shared-ui-components';
import {
  BookOpen,
  Users,
  Swords,
  ChevronRight,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    title: 'Pokedex',
    description:
      'Browse and search through all Pokemon species. View stats, abilities, moves, and evolution chains.',
    icon: BookOpen,
    href: '/pokedex',
  },
  {
    title: 'Team Builder',
    description:
      'Create and customize your dream team. Analyze type coverage and optimize your strategy.',
    icon: Users,
    href: '/team-builder',
  },
  {
    title: 'Battle',
    description:
      'Test your skills against other trainers. Climb the ranks and prove your mastery.',
    icon: Swords,
    href: '/battle',
    comingSoon: true,
  },
];

const stats = [
  { label: 'Pokemon', value: '1000+' },
  { label: 'Moves', value: '800+' },
  { label: 'Abilities', value: '300+' },
];

function FeaturedPokemonCard({ pokemon }: { pokemon: FeaturedPokemon }) {
  return (
    <Link href={`/pokedex/${pokemon.id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <CardContent className="flex flex-col items-center p-4">
          <div className="relative h-32 w-32">
            <Image
              src={pokemon.artwork}
              alt={pokemon.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-110"
              sizes="128px"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            #{pokemon.num.toString().padStart(3, '0')}
          </p>
          <h3 className="text-lg font-semibold">{pokemon.name}</h3>
          <div className="mt-2 flex gap-1">
            {pokemon.types.map((type) => (
              <PokemonTypeBadge key={type} pokemonType={type as TypeName} />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/90 to-secondary/90"></div>
        <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-20 mix-blend-overlay"></div>

        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <h1 className="text-balance text-4xl font-bold text-white md:text-5xl lg:text-6xl">
                  Begin Your Pokémon Journey
                </h1>
                <p className="mt-4 text-balance text-lg text-white/80 md:text-xl">
                  Explore the vast world of Pokémon, discover new species, and
                  become the ultimate Pokémon Trainer.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/pokedex">
                  <Button className="rounded-full bg-white px-6 py-6 font-medium text-primary shadow-lg transition hover:bg-white/90">
                    Explore Pokedex
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="rounded-full bg-white/20 px-6 py-6 font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-white/30">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/images/battle-artwork.png"
                alt="PokeHub Battle Artwork"
                width={640}
                height={640}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="glass border-y border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary md:text-4xl">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground md:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tools and resources to enhance your Pokemon experience
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.comingSoon ? '#' : feature.href}
              className={feature.comingSoon ? 'cursor-not-allowed' : ''}
            >
              <Card
                className={`h-full transition-all duration-300 ${
                  feature.comingSoon
                    ? 'opacity-60'
                    : 'hover:scale-105 hover:shadow-xl'
                }`}
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {feature.title}
                    {feature.comingSoon && (
                      <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Coming Soon
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Pokemon Section */}
      <div className="bg-muted/50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Discover Popular Pokemon
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start your journey with these fan favorites
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {FEATURED_POKEMON.map((pokemon) => (
              <FeaturedPokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/pokedex">
              <Button size="lg" className="rounded-full">
                Explore All Pokemon
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/pokedex"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Pokedex
              </Link>
              <Link
                href="/team-builder"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Team Builder
              </Link>
              <Link
                href="https://github.com/Imads608/PokeHub-App"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Pokemon fans, by Pokemon fans
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
