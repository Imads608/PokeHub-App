import { Button } from '@pokehub/frontend/shared-ui-components';
import { ChevronRight, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen">
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
                <Button className="rounded-full bg-white px-6 py-6 font-medium text-primary shadow-lg transition hover:bg-white/90">
                  Explore Pokédex
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Link href="/login">
                  <Button className="rounded-full bg-white/20 px-6 py-6 font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-white/30">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-64 w-64 overflow-hidden rounded-full border-8 border-white/30 bg-white/10 shadow-2xl backdrop-blur-sm md:h-80 md:w-80">
                <div className="absolute inset-0 m-auto h-16 w-full bg-white/20"></div>
                <div className="absolute inset-0 m-auto h-32 w-32 rounded-full border-8 border-white/50 bg-white/20 backdrop-blur-sm md:h-40 md:w-40"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
