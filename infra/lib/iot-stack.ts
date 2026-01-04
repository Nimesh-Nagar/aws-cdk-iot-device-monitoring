import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as iot from "aws-cdk-lib/aws-iot";
import * as fs from "fs";
import * as path from "path";

export class IotCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Create a IOT Policy
    const iotPolicy = new iot.CfnPolicy(this, "IotPolicy", {
      policyName: "ElementalIotPolicy",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "iot:Connect",
              "iot:Publish",
              "iot:Subscribe",
              "iot:Receive",
            ],
            Resource: ["*"],
          },
        ],
      },
    });

    // create 5 IoT Things named rpi-001 to rpi-005 with certificates
    for (let i = 1; i <= 5; i++) {
      const thingName = `rpi-${i.toString().padStart(3, "0")}`;
      const thing = new iot.CfnThing(this, `MyIotThing${i}`, {
        thingName,
      });

      // Read CSR from file
      const csrPath = path.join(__dirname, "..", "certificates", `${thingName}.csr`);
      const csrContent = fs.readFileSync(csrPath, "utf8");

      // Create certificate
      const cert = new iot.CfnCertificate(this, `Cert${i}`, {
        status: "ACTIVE",
        certificateSigningRequest: csrContent,
      });

      // Attach certificate to thing
      new iot.CfnThingPrincipalAttachment(this, `ThingPrincipal${i}`, {
        thingName,
        principal: cert.attrArn,
      });

      // Attach policy to certificate
      new iot.CfnPolicyPrincipalAttachment(this, `PolicyPrincipal${i}`, {
        policyName: iotPolicy.policyName!,
        principal: cert.attrArn,
      });

      // Export certificate ARN
      new cdk.CfnOutput(this, `Cert${i}ArnOutput`, {
        value: cert.attrArn,
        exportName: `Cert${i}Arn`,
      });

    }

    // // Create a IOT Policy
    // const iotPolicy = new iot.CfnPolicy(this, "IotPolicy", {
    //   policyName: "ElementalIotPolicy",
    //   policyDocument: {
    //     Version: "2012-10-17",
    //     Statement: [
    //       {
    //         Effect: "Allow",
    //         Action: [
    //           "iot:Connect",
    //           "iot:Publish",
    //           "iot:Subscribe",
    //           "iot:Receive",
    //         ],
    //         Resource: ["*"],
    //       },
    //     ],
    //   },
    // });

    // ------ end of stack definition ------
  }
}
