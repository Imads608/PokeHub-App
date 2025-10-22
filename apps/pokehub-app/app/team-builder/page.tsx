import { TeamViewer } from '@pokehub/frontend/pokehub-team-builder';

export default async function TeamBuilderPage() {
  // await for 5 seconds to simulate a server-side delay
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return <TeamViewer />;
}
