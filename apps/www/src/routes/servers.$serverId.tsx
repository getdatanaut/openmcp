import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/servers/$serverId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/servers/"!</div>;
}
