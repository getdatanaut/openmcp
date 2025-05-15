import { Button, ButtonGroup, twMerge } from '@datanaut/ui-primitives';
import { Code } from '@datanaut/ui-primitives/code';

const clients = {
  claude: {
    name: 'Claude',
    icon: ClaudeIcon,
  },
  cursor: {
    name: 'Cursor',
    icon: CursorIcon,
  },
  vscode: {
    name: 'VS Code',
    icon: VSCodeIcon,
  },
  windsurf: {
    name: 'Windsurf',
    icon: WindsurfIcon,
  },
  cline: {
    name: 'Cline',
    icon: ClineIcon,
  },
  goose: {
    name: 'Goose',
    icon: GooseIcon,
  },
  bolt: {
    name: 'BoltAI',
    icon: BoltIcon,
  },
  witsy: {
    name: 'Witsy',
    icon: WitsyIcon,
  },
  rootcode: {
    name: 'RootCode',
    icon: RootCodeIcon,
  },
};

export type ClientId = keyof typeof clients;

const examples = {
  weather: {
    name: 'Weather.gov',
    icon: WeatherGovIcon,
    type: 'openapi',
    target: 'https://api.weather.gov/openapi.json',
  },
  exa: {
    name: 'Exa',
    icon: ExaIcon,
    type: 'openapi',
    target: 'https://raw.githubusercontent.com/exa-labs/openapi-spec/refs/heads/master/exa-openapi-spec.yaml',
  },
};

export type ExampleId = keyof typeof examples;

export function CommandExplorer({
  clientId,
  exampleId,
  setClientId,
  setExampleId,
}: {
  clientId: ClientId | null;
  exampleId: ExampleId | null;
  setClientId: (clientId: ClientId) => void;
  setExampleId: (exampleId: ExampleId) => void;
}) {
  const example = exampleId ? examples[exampleId] : null;
  const command =
    clientId && example
      ? `npx -y openmcp@latest install \\
  ${example.target} \\
  --client ${clientId}`
      : 'Please select a client and example';

  return (
    <div className="flex flex-col gap-20">
      {/* <h3 className="px-16 text-3xl font-bold">Try it out</h3> */}

      <div className="flex flex-col gap-6">
        <div className="relative flex items-center gap-4 px-16 max-lg:px-6 md:max-lg:justify-center">
          <div className="ak-layer-0.5 flex h-8 w-8 items-center justify-center border-[1px] border-dashed font-bold lg:absolute lg:top-1/2 lg:left-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
            1
          </div>

          <div className="font-medium">Pick your chat client</div>
        </div>

        <div className="px-16 max-lg:px-6">
          <ButtonGroup variant="outline" size="sm" className="flex-wrap items-center md:max-lg:justify-center">
            {Object.entries(clients).map(([id]) => (
              <ClientButton key={id} id={id as ClientId} currentClient={clientId} setClient={setClientId} />
            ))}
          </ButtonGroup>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="relative flex items-center gap-4 px-16 max-lg:px-6 md:max-lg:justify-center">
          <div className="ak-layer-0.5 flex h-8 w-8 items-center justify-center border-[1px] border-dashed font-bold lg:absolute lg:top-1/2 lg:left-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
            2
          </div>

          <div className="font-medium">Pick an example</div>
        </div>

        <div className="px-16 max-lg:px-6">
          <ButtonGroup variant="outline" size="sm" className="flex-wrap items-center md:max-lg:justify-center">
            {Object.entries(examples).map(([id]) => (
              <ExampleButton key={id} id={id as ExampleId} currentExample={exampleId} setExample={setExampleId} />
            ))}
          </ButtonGroup>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="relative flex items-center gap-4 px-16 max-lg:px-6 md:max-lg:justify-center">
          <div className="ak-layer-0.5 flex h-8 w-8 items-center justify-center border-[1px] border-dashed font-bold lg:absolute lg:top-1/2 lg:left-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
            3
          </div>

          <div className="font-medium">Run this command in your terminal</div>
        </div>

        <div className="px-16 max-lg:px-6">
          <Code
            lang={clientId && example ? 'bash' : undefined}
            content={command}
            className="ak-layer-down-0.5 overflow-x-auto rounded border leading-relaxed whitespace-pre"
            paddingX={5}
            paddingY={4}
            copyButton={clientId && example ? 'always' : undefined}
            lineNumbers
          />
        </div>
      </div>
    </div>
  );
}

function ClientButton({
  id,
  currentClient,
  setClient,
}: {
  id: ClientId;
  currentClient: ClientId | null;
  setClient: (client: ClientId) => void;
}) {
  const client = clients[id];
  const ClientIcon = client.icon;

  return (
    <Button
      className="gap-1.5"
      icon={<ClientIcon className="h-4 w-4" />}
      onClick={() => setClient(id)}
      variant={currentClient === id ? 'solid' : 'outline'}
    >
      {client.name}
    </Button>
  );
}

function ExampleButton({
  id,
  currentExample,
  setExample,
}: {
  id: ExampleId;
  currentExample: ExampleId | null;
  setExample: (example: ExampleId) => void;
}) {
  const example = examples[id];
  const ExampleIcon = example.icon;

  return (
    <Button
      className="gap-1.5"
      icon={<ExampleIcon className="h-4 w-4" />}
      onClick={() => setExample(id)}
      variant={currentExample === id ? 'solid' : 'outline'}
    >
      {example.name} ({example.type})
    </Button>
  );
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      className={twMerge('text-[#CC7C5E]', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.92 15.3L9.86 13.1L9.92 12.9L9.86 12.8H9.66L9 12.76L6.76 12.7L4.8 12.6L2.9 12.5L2.42 12.4L2 11.8L2.04 11.5L2.44 11.24L3.02 11.28L4.28 11.38L6.18 11.5L7.56 11.58L9.6 11.82H9.92L9.96 11.68L9.86 11.6L9.78 11.52L7.8 10.2L5.68 8.8L4.56 7.98L3.96 7.58L3.66 7.18L3.54 6.34L4.08 5.74L4.82 5.8L5 5.84L5.74 6.42L7.34 7.64L9.4 9.2L9.7 9.44L9.82 9.36L9.84 9.3L9.7 9.08L8.6 7L7.4 4.92L6.86 4.06L6.72 3.54C6.66 3.34 6.64 3.14 6.64 2.94L7.24 2.1L7.6 2L8.44 2.12L8.76 2.4L9.28 3.6L10.1 5.46L11.4 7.98L11.8 8.74L12 9.42L12.06 9.62H12.2V9.52L12.3 8.08L12.5 6.34L12.7 4.1L12.76 3.46L13.08 2.7L13.68 2.3L14.2 2.52L14.6 3.1L14.54 3.46L14.32 5L13.8 7.42L13.5 9.06H13.68L13.88 8.84L14.7 7.76L16.08 6.04L16.68 5.34L17.4 4.6L17.86 4.24H18.72L19.34 5.18L19.06 6.16L18.18 7.28L17.44 8.22L16.38 9.64L15.74 10.78L15.8 10.86H15.94L18.34 10.34L19.62 10.12L21.14 9.86L21.84 10.18L21.92 10.5L21.64 11.18L20 11.58L18.08 11.98L15.22 12.64L15.18 12.66L15.22 12.72L16.5 12.84L17.06 12.88H18.42L20.94 13.08L21.6 13.48L21.98 14.02L21.92 14.42L20.9 14.94L19.54 14.62L16.34 13.86L15.26 13.6H15.1V13.68L16.02 14.58L17.68 16.08L19.8 18.02L19.9 18.5L19.64 18.9L19.36 18.86L17.52 17.46L16.8 16.86L15.2 15.5H15.1V15.64L15.46 16.18L17.42 19.12L17.52 20.02L17.38 20.3L16.86 20.5L16.32 20.38L15.16 18.78L13.96 16.98L13.02 15.34L12.92 15.42L12.34 21.46L12.08 21.76L11.48 22L10.98 21.6L10.7 21L10.98 19.76L11.3 18.16L11.56 16.88L11.8 15.3L11.94 14.78V14.74H11.8L10.6 16.4L8.8 18.86L7.36 20.38L7.02 20.52L6.42 20.22L6.48 19.66L6.8 19.2L8.8 16.64L10 15.06L10.8 14.14L10.78 14.04H10.72L5.44 17.48L4.5 17.6L4.1 17.2L4.14 16.6L4.34 16.4L5.94 15.3H5.92Z"></path>
    </svg>
  );
}

function CursorIcon({ className }: { className?: string }) {
  return <img className={className} src="https://www.cursor.com/favicon-48x48.png" />;
}

function VSCodeIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 16 16"
      className={twMerge('text-[#0098FF]', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.8634 13.9195C10.6568 14.0195 10.4233 14.0246 10.2185 13.9444C10.1162 13.9044 10.021 13.843 9.93997 13.7614L4.81616 9.06268L2.58433 10.7656C2.37657 10.9241 2.08597 10.9111 1.89301 10.7347L1.17719 10.0802C0.941168 9.86437 0.940898 9.49112 1.17661 9.27496L3.11213 7.5L1.17661 5.72504C0.940898 5.50888 0.941168 5.13563 1.17719 4.91982L1.89301 4.2653C2.08597 4.08887 2.37657 4.07588 2.58433 4.2344L4.81616 5.93732L9.93997 1.23855C9.97037 1.20797 10.0028 1.18023 10.0368 1.15538C10.2748 0.981429 10.5922 0.949298 10.8634 1.08048L13.5399 2.37507C13.8212 2.5111 14 2.79721 14 3.11109V8H10.752V4.53356L6.86419 7.5L10.752 10.4664V8H14V11.8889C14 12.2028 13.8211 12.4889 13.5399 12.625L10.8634 13.9195Z"></path>
    </svg>
  );
}

function WindsurfIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 1024 1024" fill="none">
      <g clipPath="url(#clip0_109_63)">
        <rect width="1024" height="1024" fill="#F9F3E9" />
        <path
          d="M897.246 286.869H889.819C850.735 286.808 819.017 318.46 819.017 357.539V515.589C819.017 547.15 792.93 572.716 761.882 572.716C743.436 572.716 725.02 563.433 714.093 547.85L552.673 317.304C539.28 298.16 517.486 286.747 493.895 286.747C457.094 286.747 423.976 318.034 423.976 356.657V515.619C423.976 547.181 398.103 572.746 366.842 572.746C348.335 572.746 329.949 563.463 319.021 547.881L138.395 289.882C134.316 284.038 125.154 286.93 125.154 294.052V431.892C125.154 438.862 127.285 445.619 131.272 451.34L309.037 705.2C319.539 720.204 335.033 731.344 352.9 735.392C397.616 745.557 438.77 711.135 438.77 667.278V508.406C438.77 476.845 464.339 451.279 495.904 451.279H495.995C515.02 451.279 532.857 460.562 543.785 476.145L705.235 706.661C718.659 725.835 739.327 737.218 763.983 737.218C801.606 737.218 833.841 705.9 833.841 667.308V508.376C833.841 476.815 859.41 451.249 890.975 451.249H897.276C901.233 451.249 904.43 448.053 904.43 444.097V294.021C904.43 290.065 901.233 286.869 897.276 286.869H897.246Z"
          fill="#0B100F"
        />
      </g>
      <defs>
        <clipPath id="clip0_109_63">
          <rect width="1024" height="1024" rx="100" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return <img className={className} src="https://icons.duckduckgo.com/ip3/boltai.com.ico" />;
}

function ClineIcon({ className }: { className?: string }) {
  return <img className={className} src="https://icons.duckduckgo.com/ip3/cline.bot.ico" />;
}

function GooseIcon({ className }: { className?: string }) {
  return <img className={className} src="https://block.github.io/goose/img/favicon.ico" />;
}

function WitsyIcon({ className }: { className?: string }) {
  return <img className={className} src="https://icons.duckduckgo.com/ip3/witsyai.com.ico" />;
}

function RootCodeIcon({ className }: { className?: string }) {
  return <img className={twMerge('rounded-xs', className)} src="https://icons.duckduckgo.com/ip3/roocode.com.ico" />;
}

function WeatherGovIcon({ className }: { className?: string }) {
  return <img className={className} src="https://icons.duckduckgo.com/ip3/weather.gov.ico" />;
}

function ExaIcon({ className }: { className?: string }) {
  return <img className={className} src="https://icons.duckduckgo.com/ip3/exa.ai.ico" />;
}
