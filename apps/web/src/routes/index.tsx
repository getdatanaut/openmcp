import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRoute,
  beforeLoad: async () => {
    throw redirect({
      replace: true,
      from: Route.id,
      to: '/threads',
    });
  },
});

function HomeRoute() {
  return <HomeComponentComponent />;
}

const HomeComponentComponent = () => {
  return <div className="flex-1">HOME TODO</div>;
};
