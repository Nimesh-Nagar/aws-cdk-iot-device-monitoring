import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as dynmodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as iot from "aws-cdk-lib/aws-iot";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // create a DynamoDB table
    const table = new dynmodb.Table(this, "SmartAppTable", {
      tableName: "device_health_data",
      partitionKey: { name: "deviceId", type: dynmodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynmodb.AttributeType.NUMBER },
      billingMode: dynmodb.BillingMode.PAY_PER_REQUEST,
    });

    // SNS Topic for IoT Alerts
    const iotAlert = new sns.Topic(this, "IotAlertTopic", {
      topicName: "DeviceHealthTopic",
      displayName: "Alert Notifications for IoT Device Health",
    });

    // Email Subscription to the SNS Topic
    const emailSubscription = new sns.Subscription(this, "EmailSubscription", {
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: "elementaliot2024@gmail.com", // Replace with your email address
      topic: iotAlert,
    });


    // IAM Role and Lambda Function to process IoT data
    const iamRole = new iam.Role(this, "SmartAppLambdaRole", {
      roleName: "SmartAppProcessorRole",
      description: "Role for Smart App Lambda to process IoT data",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Attach necessary policies to the role (using managed policies for simplicity)
    iamRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );
    iamRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSNSFullAccess")
    );
    iamRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess")
    );


    // Lambda function to process IoT data
    const lamddaFunc = new lambda.Function(this, "SmartAppLambdaFunction", {
      description:
        "Processes IoT data and stores in DynamoDB and sends alerts via SNS",
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "lambda_function.lambda_handler",
      code: lambda.Code.fromAsset("../services/"),
      role: iamRole,
    });

    // Ensure Lambda function is created after the IAM Role
    lamddaFunc.node.addDependency(iamRole);


    // iot rules can be added here to route data to the lambda function
    const iotRule = new iot.CfnTopicRule(this, "IotToLambdaRule", {
      ruleName: "IotToLambdaRule",
      topicRulePayload: {
        sql: "SELECT * FROM 'device/+/data'",
        actions: [
          {
            lambda: {
              functionArn: lamddaFunc.functionArn,
            },
          },
        ],
        awsIotSqlVersion: "2016-03-23",
        ruleDisabled: false,
      },
    });

    // Ensure IoT Rule is created after the Lambda Function
    iotRule.node.addDependency(lamddaFunc);


    // Allow IoT Core to invoke Lambda
    lamddaFunc.addPermission("AllowIotInvoke", {
      principal: new iam.ServicePrincipal("iot.amazonaws.com"),
      sourceArn: `arn:aws:iot:${this.region}:${this.account}:rule/IotToLambdaRule`,
    });

  }
}
