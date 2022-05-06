import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EcsApiStack } from './ecs-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
const path = require('path');

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // TODO demo create a ecs construct
    // create a vpc

    // import default VPC from CDK
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // backend container
    const backendContainer: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../api')),
      cpu: 0,
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'echo-api-req',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [
        {
          containerPort: 8000,
        },
      ],
    };

    new EcsApiStack(this, 'EcsApiStack', { vpc, backendContainer });
  }
}
