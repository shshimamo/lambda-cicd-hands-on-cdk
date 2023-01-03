import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Context } from './common/context'

interface CodebuildStackStackProps extends cdk.StackProps {
    bucket: s3.Bucket,
    buildProjectLogGroup: logs.LogGroup,
}

export class CodebuildStack extends cdk.Stack {
    public readonly buildProject: codebuild.Project;

    constructor(scope: Construct, id: string, props: CodebuildStackStackProps) {
        super(scope, id, props);

        // CodeBuild ビルドプロジェクト
        this.buildProject = new codebuild.Project(this, 'BuildProjectDev', {
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
                    logGroup: props.buildProjectLogGroup,
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
            // artifacts: codebuild.Artifacts.s3({
            //     bucket: props.bucket,
            //     includeBuildId: false,
            //     packageZip: false,
            //     identifier: 'BuildArtifact',
            //     name: `${Context.ID_PREFIX}-lambda-cicd-hands-on`
            // }),
        });

        // ポリシー追加
        this.buildProject.addToRolePolicy(
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
    }
}
