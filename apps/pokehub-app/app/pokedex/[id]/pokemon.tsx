const Pokemon = () => {
  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/pokedex">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Pokédex
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {id > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToPokemon(id - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />#
                {(id - 1).toString().padStart(3, '0')}
              </Button>
            )}
            {id < 151 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToPokemon(id + 1)}
              >
                #{(id + 1).toString().padStart(3, '0')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Pokemon Header */}
        <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg font-semibold text-muted-foreground">
                  #{pokemon.id.toString().padStart(3, '0')}
                </span>
                <h1 className="text-3xl font-bold md:text-4xl">
                  {pokemon.name}
                </h1>
              </div>
              <div className="mb-4 flex gap-2">
                {pokemon.types.map((type) => (
                  <Badge
                    key={type}
                    className={`${
                      typeColors[type as keyof typeof typeColors]
                    } text-sm capitalize`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                {pokemon.description}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                    Height
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    {pokemon.height} m
                  </p>
                </div>
                <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Weight className="h-4 w-4" />
                    Weight
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    {pokemon.weight} kg
                  </p>
                </div>
                <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Dna className="h-4 w-4" />
                    Category
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    {pokemon.category}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="h-48 w-48 rounded-full bg-primary"></div>
                </div>
                <img
                  src={pokemon.image || '/placeholder.svg'}
                  alt={pokemon.name}
                  className="relative z-10 h-64 w-64 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="stats" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
            <TabsTrigger value="moves">Moves</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Base Stats</CardTitle>
                  <CardDescription>
                    The base statistics of this Pokémon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">HP</span>
                        <span className="text-sm">{pokemon.stats.hp}</span>
                      </div>
                      <Progress
                        value={(pokemon.stats.hp / 255) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Attack</span>
                        <span className="text-sm">{pokemon.stats.attack}</span>
                      </div>
                      <Progress
                        value={(pokemon.stats.attack / 255) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Defense</span>
                        <span className="text-sm">{pokemon.stats.defense}</span>
                      </div>
                      <Progress
                        value={(pokemon.stats.defense / 255) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Sp. Attack</span>
                        <span className="text-sm">
                          {pokemon.stats.spAttack}
                        </span>
                      </div>
                      <Progress
                        value={(pokemon.stats.spAttack / 255) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Sp. Defense</span>
                        <span className="text-sm">
                          {pokemon.stats.spDefense}
                        </span>
                      </div>
                      <Progress
                        value={(pokemon.stats.spDefense / 255) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Speed</span>
                        <span className="text-sm">{pokemon.stats.speed}</span>
                      </div>
                      <Progress
                        value={(pokemon.stats.speed / 255) * 100}
                        className="h-2"
                      />
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-sm">{totalStats}</span>
                      </div>
                      <Progress
                        value={(totalStats / 1530) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Type Effectiveness</CardTitle>
                  <CardDescription>
                    How different types affect this Pokémon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weakTo.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Swords className="h-4 w-4 text-destructive" />
                          Weak to
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {weakTo.map(({ type, value }) => (
                            <Badge
                              key={type}
                              className={`${
                                typeColors[type as keyof typeof typeColors]
                              } capitalize`}
                            >
                              {type} {value === 4 ? '(4x)' : '(2x)'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {resistantTo.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Shield className="h-4 w-4 text-primary" />
                          Resistant to
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resistantTo.map(({ type, value }) => (
                            <Badge
                              key={type}
                              className={`${
                                typeColors[type as keyof typeof typeColors]
                              } capitalize`}
                            >
                              {type} {value === 0.25 ? '(¼x)' : '(½x)'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {immuneTo.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Shield className="h-4 w-4 text-secondary" />
                          Immune to
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {immuneTo.map((type) => (
                            <Badge
                              key={type}
                              className={`${
                                typeColors[type as keyof typeof typeColors]
                              } capitalize`}
                            >
                              {type} (0x)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolution Chain</CardTitle>
                <CardDescription>How this Pokémon evolves</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                  {pokemon.evolutions.map((evolution, index) => (
                    <div
                      key={evolution.id}
                      className="flex flex-1 flex-col items-center"
                    >
                      <Link href={`/pokedex/${evolution.id}`} className="group">
                        <div
                          className={`mb-2 rounded-full p-4 transition-colors ${
                            evolution.id === pokemon.id
                              ? 'bg-primary/10'
                              : 'bg-muted group-hover:bg-muted/80'
                          }`}
                        >
                          <img
                            src={evolution.image || '/placeholder.svg'}
                            alt={evolution.name}
                            className="h-24 w-24 object-contain transition-transform group-hover:scale-110"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            #{evolution.id.toString().padStart(3, '0')}
                          </p>
                          <p
                            className={`font-medium ${
                              evolution.id === pokemon.id ? 'text-primary' : ''
                            }`}
                          >
                            {evolution.name}
                          </p>
                        </div>
                      </Link>

                      {index < pokemon.evolutions.length - 1 &&
                        evolution.condition && (
                          <div className="my-4 flex items-center md:my-0 md:ml-4">
                            <div className="flex flex-col items-center md:flex-row">
                              <ArrowRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground md:mb-0 md:mr-2 md:rotate-0" />
                              <span className="text-center text-xs text-muted-foreground">
                                {evolution.condition}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moves Tab */}
          <TabsContent value="moves" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Moves</CardTitle>
                <CardDescription>
                  Moves that {pokemon.name} can learn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="levelup">
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="levelup">Level Up</TabsTrigger>
                    <TabsTrigger value="tm">TM/HM</TabsTrigger>
                    <TabsTrigger value="egg">Egg Moves</TabsTrigger>
                  </TabsList>

                  <TabsContent value="levelup">
                    <ScrollArea className="h-[400px] pr-4">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b text-left">
                            <th className="pb-2 text-sm font-medium">Move</th>
                            <th className="pb-2 text-sm font-medium">Type</th>
                            <th className="pb-2 text-sm font-medium">Cat.</th>
                            <th className="pb-2 text-sm font-medium">Power</th>
                            <th className="pb-2 text-sm font-medium">Acc.</th>
                            <th className="pb-2 text-sm font-medium">PP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pokemon.moves
                            .filter((move) => move.learnMethod === 'Level Up')
                            .map((move, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 text-sm font-medium">
                                  {move.name}
                                </td>
                                <td className="py-2">
                                  <Badge
                                    className={`${
                                      typeColors[
                                        move.type as keyof typeof typeColors
                                      ]
                                    } capitalize`}
                                  >
                                    {move.type}
                                  </Badge>
                                </td>
                                <td className="py-2">
                                  <span
                                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                      move.category === 'physical'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                        : move.category === 'special'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    }`}
                                  >
                                    {move.category.charAt(0).toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 text-sm">{move.power}</td>
                                <td className="py-2 text-sm">
                                  {move.accuracy}
                                </td>
                                <td className="py-2 text-sm">{move.pp}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="tm">
                    <ScrollArea className="h-[400px] pr-4">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b text-left">
                            <th className="pb-2 text-sm font-medium">Move</th>
                            <th className="pb-2 text-sm font-medium">Type</th>
                            <th className="pb-2 text-sm font-medium">Cat.</th>
                            <th className="pb-2 text-sm font-medium">Power</th>
                            <th className="pb-2 text-sm font-medium">Acc.</th>
                            <th className="pb-2 text-sm font-medium">PP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pokemon.moves
                            .filter((move) => move.learnMethod === 'TM/HM')
                            .map((move, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 text-sm font-medium">
                                  {move.name}
                                </td>
                                <td className="py-2">
                                  <Badge
                                    className={`${
                                      typeColors[
                                        move.type as keyof typeof typeColors
                                      ]
                                    } capitalize`}
                                  >
                                    {move.type}
                                  </Badge>
                                </td>
                                <td className="py-2">
                                  <span
                                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                      move.category === 'physical'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                        : move.category === 'special'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    }`}
                                  >
                                    {move.category.charAt(0).toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 text-sm">{move.power}</td>
                                <td className="py-2 text-sm">
                                  {move.accuracy}
                                </td>
                                <td className="py-2 text-sm">{move.pp}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="egg">
                    <ScrollArea className="h-[400px] pr-4">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b text-left">
                            <th className="pb-2 text-sm font-medium">Move</th>
                            <th className="pb-2 text-sm font-medium">Type</th>
                            <th className="pb-2 text-sm font-medium">Cat.</th>
                            <th className="pb-2 text-sm font-medium">Power</th>
                            <th className="pb-2 text-sm font-medium">Acc.</th>
                            <th className="pb-2 text-sm font-medium">PP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pokemon.moves
                            .filter((move) => move.learnMethod === 'Egg Move')
                            .map((move, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 text-sm font-medium">
                                  {move.name}
                                </td>
                                <td className="py-2">
                                  <Badge
                                    className={`${
                                      typeColors[
                                        move.type as keyof typeof typeColors
                                      ]
                                    } capitalize`}
                                  >
                                    {move.type}
                                  </Badge>
                                </td>
                                <td className="py-2">
                                  <span
                                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                      move.category === 'physical'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                        : move.category === 'special'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    }`}
                                  >
                                    {move.category.charAt(0).toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 text-sm">{move.power}</td>
                                <td className="py-2 text-sm">
                                  {move.accuracy}
                                </td>
                                <td className="py-2 text-sm">{move.pp}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Where to Find</CardTitle>
                <CardDescription>
                  Locations where {pokemon.name} can be found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pokemon.locations.length > 0 ? (
                    pokemon.locations.map((location, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <div className="rounded-full bg-primary/10 p-2">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{location.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {location.method}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
                      <div className="mb-4 rounded-full bg-muted p-3">
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 text-lg font-medium">
                        No Location Data
                      </h3>
                      <p className="text-center text-muted-foreground">
                        Location information for this Pokémon is not available.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Abilities</CardTitle>
                  <CardDescription>
                    Special abilities of this Pokémon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pokemon.abilities.map((ability, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium">{ability.name}</h4>
                          {ability.isHidden && (
                            <Badge variant="outline" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ability.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Breeding</CardTitle>
                  <CardDescription>
                    Breeding information for this Pokémon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Gender Ratio</h4>
                      <div className="flex h-4 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-blue-500"
                          style={{ width: `${pokemon.gender.male}%` }}
                        ></div>
                        <div
                          className="bg-pink-500"
                          style={{ width: `${pokemon.gender.female}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span>♂ {pokemon.gender.male}%</span>
                        <span>♀ {pokemon.gender.female}%</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">Egg Groups</h4>
                      <div className="flex flex-wrap gap-2">
                        {pokemon.eggGroups.map((group, index) => (
                          <Badge key={index} variant="outline">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">Hatch Time</h4>
                      <p>{pokemon.hatchSteps} steps</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Training</CardTitle>
                  <CardDescription>
                    Information for training this Pokémon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Base EXP</h4>
                      <p>{pokemon.baseExp}</p>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">EV Yield</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(pokemon.evYield).map(
                          ([stat, value]) =>
                            value > 0 && (
                              <div
                                key={stat}
                                className="rounded-lg border p-2 text-center"
                              >
                                <p className="text-xs text-muted-foreground">
                                  {stat.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="font-medium">+{value}</p>
                              </div>
                            )
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">Catch Rate</h4>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(pokemon.catchRate / 255) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm">{pokemon.catchRate}/255</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Base Happiness
                      </h4>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(pokemon.baseHappiness / 255) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm">
                          {pokemon.baseHappiness}/255
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">Growth Rate</h4>
                      <p>{pokemon.growthRate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Information</CardTitle>
                  <CardDescription>
                    Additional details about this Pokémon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Generation</h4>
                      <Badge variant="outline">
                        Generation {pokemon.generation}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="rounded-full bg-primary/10 p-6">
                        <Sparkles className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
