#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { Utils } from '../lib/utils';

const app = new cdk.App();
const stackName = Utils.getEnv('STACK_NAME');
const stackAccount = Utils.getEnv('STACK_ACCOUNT');
const stackRegion = Utils.getEnv('STACK_REGION');
const stackProps = { env: { region: stackRegion, account: stackAccount } };

cdk.Tags.of(app).add('App', stackName);

new MainStack(app, stackName, stackProps);
