#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodebuildStack } from '../lib/codebuild-stack';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { PipelineDevStack } from '../lib/pipeline-dev-stack';
import { PipelinePrdStack } from '../lib/pipeline-prd-stack';
import { Context } from '../lib/common/context'

const app = new cdk.App();

const infra = new InfrastructureStack(app, `${Context.ID_PREFIX}-InfrastructureStack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
});

const codebuild = new CodebuildStack(app, `${Context.ID_PREFIX}-CodebuildStack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
    bucket: infra.bucket,
    buildProjectLogGroup: infra.buildProjectLogGroupDev
});

new PipelineDevStack(app, `${Context.ID_PREFIX}-PipelineDevStack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
    buildProject: codebuild.buildProject,
});

new PipelinePrdStack(app, `${Context.ID_PREFIX}-PipelinePrdStack`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
    buildProject: codebuild.buildProject,
});
