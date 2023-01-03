#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { PipelineDevStack } from '../lib/pipeline-dev-stack';
import { Context } from '../lib/common/context'

const app = new cdk.App();

const infra = new InfrastructureStack(app, `${Context.ID_PREFIX}-InfrastructureStack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
});

new PipelineDevStack(app, `${Context.ID_PREFIX}-PipelineDevStack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
    bucket: infra.bucket,
});
