NODE_ENV=development \
NODE_OPTIONS="--conditions=development --loader=ts-node/esm" \
TS_NODE_PROJECT="$(pwd)/packages/cli/tsconfig.json" \
TS_NODE_TRANSPILE_ONLY=1 \
openmcp
