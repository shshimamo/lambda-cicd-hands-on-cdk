import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class InfrastructureStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3
        this.bucket = new s3.Bucket(this, 'SamBucket', {
          bucketName: 'lambda-cicd-sam-bucket',
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
        });
    }
}
