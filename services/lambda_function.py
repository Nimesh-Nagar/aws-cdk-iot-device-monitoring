import json
import boto3
from decimal import Decimal

# AWS clients (outside handler for reuse)
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

TABLE_NAME = 'device_health_data'
SNS_TOPIC_ARN = 'arn:aws:sns:ap-south-1:390844747391:DeviceHealthTopic'
CPU_THRESHOLD = Decimal('85')  # percent

table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        print("Received event:", json.dumps(event))

        # If event comes as string (sometimes via IoT rules)
        if isinstance(event, str):
            message = json.loads(event)
        else:
            message = event

        # Required fields validation
        required_keys = ['deviceId', 'timestamp', 'quality', 'value']
        for key in required_keys:
            if key not in message:
                raise KeyError(f"Missing required field: {key}")

        deviceID = message['deviceId']
        timestamp = Decimal(str(message['timestamp']))
        quality = message['quality']
        cpu_value = Decimal(str(message['value']))

        # DynamoDB item
        item = {
            'deviceId': deviceID,        # Partition Key
            'timestamp': timestamp,           # Sort Key
            'quality': quality,
            'cpu_usage': cpu_value
        }

        # Store metric
        table.put_item(Item=item)

        # High CPU alert
        if cpu_value >= CPU_THRESHOLD:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="🚨 High CPU Usage Alert 🚨",
                Message=(
                    f"Device: {deviceID}\n"
                    f"CPU Usage: {cpu_value}%\n"
                    f"Timestamp: {timestamp}"
                )
            )

        return {
            'statusCode': 200,
            'body': json.dumps("Metric stored successfully")
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }
