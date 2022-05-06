#!/usr/bin/env bash

set -e
source ./env.sh

cd ./cdk/
echo "generating CFN"
npm run cdk-synth
