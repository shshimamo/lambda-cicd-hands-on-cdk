#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaCicdHandsOnCdkStack } from '../lib/lambda-cicd-hands-on-cdk-stack';
import { Context } from '../lib/common/context'

const app = new cdk.App();
new LambdaCicdHandsOnCdkStack(app, `${Context.ID_PREFIX}-Stack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
});