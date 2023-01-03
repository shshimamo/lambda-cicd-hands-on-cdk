import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Context } from './common/context'

interface PipelineDevStackProps extends cdk.StackProps {
    bucket: s3.Bucket,
}

export class PipelineDevStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineDevStackProps) {
        super(scope, id, props);

        /*
            CodeBuild ビルドプロジェクト
         */
        const buildProjectLogGroup = new logs.LogGroup(this, 'BuildProjectDevLogGroup', {
            logGroupName: `${Context.ID_PREFIX}-build-project`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const buildProject = new codebuild.Project(this, 'BuildProjectDev', {
            projectName: `${Context.ID_PREFIX}-lambda-cicd-hands-on`,
            source: codebuild.Source.gitHub({
                owner: 'shshimamo',
                repo: 'lambda-cicd-hands-on',
                webhook: true,
                branchOrRef: 'main'
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
                // privileged: true,
            },
            logging: {
                cloudWatch: {
                    logGroup: buildProjectLogGroup,
                }
            },
            environmentVariables: {
                S3_BUCKET: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: props.bucket.bucketName,
                },
                STACKNAME: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: `${Context.ID_PREFIX}-sam-app`,
                },
                REGION: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: 'ap-northeast-1',
                },
                ENV: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: 'manual',
                }
            },
            artifacts: codebuild.Artifacts.s3({
                bucket: props.bucket,
                includeBuildId: false,
                packageZip: false,
                identifier: 'BuildArtifact',
                name: `${Context.ID_PREFIX}-lambda-cicd-hands-on`
            }),
        });
        buildProject.addToRolePolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: [
                    "iam:*",
                    "s3:*",
                    "cloudwatch:*",
                    "cloudformation:*",
                    "lambda:*",
                ]
            })
        )

        /*
            CodePipeline(開発環境用)
         */
        const pipeline = new codepipeline.Pipeline(this, 'PipelineDev', {
            pipelineName: `${Context.ID_PREFIX}-lambda-hands-on-dev`
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
            project: buildProject,
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

        /*
            CodePipeline(本番環境用)
         */
        const pipelinePrd = new codepipeline.Pipeline(this, 'PipelinePrd', {
            pipelineName: `${Context.ID_PREFIX}-lambda-hands-on-prd`
        });

        // ソースステージを追加
        const sourceOutputPrd = new codepipeline.Artifact();
        const sourceActionPrd = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'shshimamo',
            repo: 'lambda-cicd-hands-on',
            branch: 'PRODUCTION',
            oauthToken: cdk.SecretValue.secretsManager('my-github-token'),
            trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
            output: sourceOutputPrd,
        });
        pipelinePrd.addStage({
            stageName: 'Source',
            actions: [sourceActionPrd],
        });

        // ビルドステージを追加
        const buildActionPrd = new codepipeline_actions.CodeBuildAction({
            actionName: `${Context.ID_PREFIX}-build`,
            project: buildProject,
            input: sourceOutputPrd,
            environmentVariables: {
                STACKNAME: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: `${Context.ID_PREFIX}-sam-app-prd`,
                },
                ENV: {
                    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                    value: 'prd',
                }
            },
        });
        pipelinePrd.addStage({
            stageName: 'Build',
            actions: [buildActionPrd],
        });
    }
}
