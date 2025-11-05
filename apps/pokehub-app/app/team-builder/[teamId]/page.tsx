import {
  TeamEditor,
  TeamEditorProvider,
} from '@pokehub/frontend/pokehub-team-builder';

export default async function TeamEditPage() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // load team here
  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Team Builder</h1>
          <p className="mt-2 text-muted-foreground">
            Build and customize your competitive Pokémon team
          </p>
        </div>
        <TeamEditorProvider>
          <TeamEditor />
        </TeamEditorProvider>
      </div>
    </div>
  );
}
