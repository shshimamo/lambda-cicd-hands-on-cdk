import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Context } from './common/context'

export class InfrastructureStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;
    public readonly buildProjectLogGroupDev: logs.LogGroup;
    public readonly buildProjectLogGroupPrd: logs.LogGroup;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3
        this.bucket = new s3.Bucket(this, 'SamBucket', {
          bucketName: 'lambda-cicd-sam-bucket',
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
        });

        this.buildProjectLogGroupDev = new logs.LogGroup(this, 'BuildProjectLogGroup-Dev', {
            logGroupName: `${Context.ID_PREFIX}-build-project-dev`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.buildProjectLogGroupPrd = new logs.LogGroup(this, 'BuildProjectLogGroup-Prd', {
            logGroupName: `${Context.ID_PREFIX}-build-project-prd`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
}
