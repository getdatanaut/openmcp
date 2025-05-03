import { Icon } from '@datanaut/ui-primitives';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faBolt, faCrosshairs, faDesktop, faDiagramProject, faShield } from '@fortawesome/free-solid-svg-icons';
import { createFileRoute, retainSearchParams } from '@tanstack/react-router';
import { z } from 'zod';

import { type ClientId, CommandExplorer, type ExampleId } from '~/components/CommandExplorer.tsx';

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: z.object({
    client: z.string().optional(),
    example: z.string().optional(), // servers search query
  }),
  search: {
    middlewares: [retainSearchParams(['client', 'example'])],
  },
});

function Home() {
  const { client, example } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="flex justify-center max-lg:flex-col max-lg:gap-10">
      <div className="flex flex-1 flex-col justify-center max-lg:gap-10 lg:h-dvh">
        <div className="border-dashed lg:border-b-[1px]">
          <div className="3xl:max-w-5/6 relative ml-auto lg:h-[7rem]">
            <h1 className="ak-layer-0.5 flex items-center gap-2 border-dashed px-4 py-3 text-7xl font-extrabold tracking-tight max-lg:justify-center max-lg:py-5 lg:absolute lg:top-full lg:left-20 lg:-translate-y-1/2 lg:rounded-xs lg:border-[1px] 2xl:left-44">
              <span>Open</span>
              <span className="ak-layer-pop-15 rounded px-2 py-1">MCP</span>
            </h1>
          </div>
        </div>

        <div className="3xl:max-w-5/6 ml-auto flex w-full flex-1 flex-col justify-center pl-20 max-lg:mx-auto max-lg:px-4 2xl:pl-44">
          <div className="flex flex-col gap-10 text-xl leading-relaxed max-lg:gap-8 max-lg:text-lg md:max-lg:items-center">
            <div className="flex items-center gap-5">
              <Icon icon={faBolt} className="w-8 shrink-0 text-[1.2em]" />
              <div>Instant MCP servers from any OpenAPI file</div>
            </div>

            <div className="flex items-center gap-5">
              <Icon icon={faGithub} className="w-8 shrink-0 text-[1.2em]" />

              <div>
                <a
                  href="https://github.com/getdatanaut/openmcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ak-text-primary hover:underline"
                >
                  Open source
                </a>
                , MIT licensed
              </div>
            </div>

            <div className="flex items-center gap-5">
              <Icon icon={faShield} className="w-8 shrink-0 text-[1.2em]" />
              <div>Private, runs locally</div>
            </div>

            <div className="flex items-center gap-5">
              <Icon icon={faCrosshairs} className="w-8 shrink-0 text-[1.2em]" />
              <div>Pick just the tools you need from each server</div>
            </div>

            <div className="flex items-center gap-5">
              <Icon icon={faDiagramProject} className="w-8 shrink-0 text-[1.2em]" />
              <div>Supports all MCP transport protocols</div>
            </div>

            <div className="flex items-center gap-5">
              <Icon icon={faDesktop} className="w-8 shrink-0 text-[1.2em]" />
              <div>Works with all major chat clients</div>
            </div>

            <div className="ak-text/50 flex items-center gap-5 max-lg:mx-auto lg:mt-12">
              <div>"Because all you need is OpenAPI"</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col border-dashed max-lg:gap-16 max-lg:pb-10 lg:h-dvh lg:max-w-[45rem] lg:border-l-[1px]">
        <div className="border-dashed lg:border-b-[1px]">
          <div className="relative lg:h-[7rem]">
            <h3 className="ak-layer-0.5 flex items-center border-dashed px-4 py-3 text-3xl font-bold max-lg:justify-center lg:absolute lg:top-full lg:left-20 lg:-translate-y-1/2 lg:rounded-xs lg:border-[1px]">
              Try it out
            </h3>
          </div>
        </div>

        <div className="flex flex-1 items-center max-lg:mx-auto max-lg:max-w-[40rem]">
          <CommandExplorer
            clientId={client as ClientId | null}
            exampleId={example as ExampleId | null}
            setClientId={client => navigate({ search: { client } })}
            setExampleId={example => navigate({ search: { example } })}
          />
        </div>
      </div>
    </div>
  );
}
