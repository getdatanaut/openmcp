import path from 'node:path';

import envalid from 'envalid';

import { constants } from '#libs/platform';

export default envalid.cleanEnv(process.env, {
  DN_API_URL: envalid.url({
    default: 'https://datanaut.ai/',
    devDefault: 'http://localhost:3001/',
    desc: 'The URL of the datanaut API',
  }),
  DN_CLIENT_ID: envalid.str({
    default: 'openmcp-cli',
  }),
  DN_CONFIGDIR: envalid.str({
    default: path.join(constants.CONFIGDIR, 'datanaut'),
  }),
});
