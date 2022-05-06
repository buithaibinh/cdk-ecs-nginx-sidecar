import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
const path = require('path');
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

export interface EcsStackProps extends StackProps {
  /**
   * The VPC for the stack
   */
  readonly vpc: ec2.IVpc;

  /**
   * backend container
   */
  readonly backendContainer: ecs.ContainerDefinitionOptions;

  /**
   * initial number of tasks for the service
   *
   * @default - 1
   */
  readonly initialTaskNumber?: number;
}

export class EcsApiStack extends Construct {
  public readonly region: string;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id);

    const { vpc } = props;
    this.region = Stack.of(this).region;

    // Fargate Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
    });

    // task iam role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role that the api task definitions use to run the api code',
    });

    // ECS task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'cdk-taskdef', {
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole,
      runtimePlatform: {
        // TODO This for M1 MAC. Remove this when build image as X86_64
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // add container (backend)

    const mainContainer = taskDefinition.addContainer('nginx', {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../nginx')),
      cpu: 0,
      portMappings: [
        {
          containerPort: 80,
        },
      ],
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'echo-http-req',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
    });

    // add real backend container
    const backendContainer = taskDefinition.addContainer(
      'backend',
      props.backendContainer
    );

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'ApiEcsService',
      {
        cluster,
        circuitBreaker: {
          rollback: true,
        },
        desiredCount: props.initialTaskNumber || 1,
        protocol: elbv2.ApplicationProtocol.HTTP,
        listenerPort: 80,
        redirectHTTP: false,
        assignPublicIp: true,
        publicLoadBalancer: true,
        taskDefinition,
      }
    );

    const healthCheckDefault = {
      port: 'traffic-port',
      path: '/healthz',
      intervalSecs: 30,
      timeoutSeconds: 5,
      healthyThresholdCount: 5,
      unhealthyThresholdCount: 2,
      healthyHttpCodes: '200,301,302',
    };
    service.targetGroup.configureHealthCheck(healthCheckDefault);

    // Configure auto scaling capabilities only when our environment equals "production"
    const scalableTarget = service.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 1,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 90,
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 90,
    });
  }
}
