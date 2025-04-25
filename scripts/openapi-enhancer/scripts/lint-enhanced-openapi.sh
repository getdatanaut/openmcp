#!/bin/bash

git_root=$(git rev-parse --show-toplevel)

spectral lint --ruleset "$git_root/scripts/openapi-enhancer/.spectral.yaml" --fail-on-unmatched-globs "$@"
