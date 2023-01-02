import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Context } from './common/context'

export class LambdaCicdHandsOnCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3
    const bucket = new s3.Bucket(this, 'SamBucket', {
      bucketName: 'lambda-cicd-sam-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CodeBuild ビルドプロジェクト
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
          value: bucket.bucketName,
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
        bucket,
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

    // CodePipeline(開発環境用)
    const pipeline = new codepipeline.Pipeline(this, 'PipelineDev', {
      pipelineName: `${Context.ID_PREFIX}-lambda-hands-on-dev`
    });

    // CodePipeline ソースステージを追加
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

    // CodePipeline ビルドステージを追加
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
  }
}
