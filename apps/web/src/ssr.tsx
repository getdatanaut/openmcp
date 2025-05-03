/// <reference types="vinxi/types/server" />
import { getRouterManifest } from '@tanstack/react-start/router-manifest';
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';

import { createRouter } from './router.tsx';

// eslint-disable-next-line react-refresh/only-export-components
export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);
