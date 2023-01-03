import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import { Context } from './common/context'

interface PipelineDevStackProps extends cdk.StackProps {
    buildProject: codebuild.Project
}

export class PipelineDevStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineDevStackProps) {
        super(scope, id, props);

        // CodePipeline(開発環境用)
        const pipeline = new codepipeline.Pipeline(this, 'PipelineDev', {
            pipelineName: `${Context.ID_PREFIX}-lambda-hands-on-dev`,
        });

        // ソースステージを追加
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'shshimamo',
            repo: 'lambda-cicd-hands-on',
            branch: 'main',
            oauthToken: cdk.SecretValue.secretsManager('my-github-token'),
            trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
            output: sourceOutput,
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [sourceAction],
        });

        // ビルドステージを追加
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: `${Context.ID_PREFIX}-build`,
            project: props.buildProject,
            input: sourceOutput,
            environmentVariables: {
                STACKNAME: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: `${Context.ID_PREFIX}-sam-app-dev`,
                },
                ENV: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: 'dev',
                }
            },
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction],
        });
    }
}
