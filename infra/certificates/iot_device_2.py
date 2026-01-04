from awscrt import mqtt
from awsiot import mqtt_connection_builder
import json
import time
import psutil
import random
import os

# ================= CONFIG =================
ENDPOINT = "a2kvznvo99btqn-ats.iot.ap-south-1.amazonaws.com"
PORT = 8883

DEVICE_ID = "rpi-002"   # change to rpi-002 for other device


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CERT_FILE = os.path.join(BASE_DIR, f"{DEVICE_ID}.crt")
KEY_FILE  = os.path.join(BASE_DIR, f"{DEVICE_ID}.key")
ROOT_CA   = os.path.join(BASE_DIR, "AmazonRootCA1.pem")

TOPIC = f"device/{DEVICE_ID}/data"
PUBLISH_INTERVAL = 10  # seconds
# ==========================================

# MQTT connection
mqtt_connection = mqtt_connection_builder.mtls_from_path(
    endpoint=ENDPOINT,
    port=PORT,
    cert_filepath=CERT_FILE,
    pri_key_filepath=KEY_FILE,
    ca_filepath=ROOT_CA,
    client_id=DEVICE_ID,
    clean_session=False,
    keep_alive_secs=30
)

# Connect
print(f"Connecting {DEVICE_ID} to AWS IoT Core...")
mqtt_connection.connect().result()
print("Connected")

try:
    while True:
        # cpu_usage = psutil.cpu_percent(interval=1)
        cpu_usage = round(random.uniform(80, 90), 2)

        payload = {
            "deviceId": DEVICE_ID,
            "timestamp": int(time.time()),
            "quality": "good",
            "value": cpu_usage
        }

        mqtt_connection.publish(
            topic=TOPIC,
            payload=json.dumps(payload),
            qos=mqtt.QoS.AT_LEAST_ONCE
        )

        print(f"Published: {payload}")
        time.sleep(PUBLISH_INTERVAL)

except KeyboardInterrupt:
    print("Disconnecting...")
    mqtt_connection.disconnect().result()
