import boto3
import os

# Initialize IoT client
iot_client = boto3.client('iot')

# Directory to save certificates
cert_dir = os.path.dirname(os.path.abspath(__file__))

def download_certificates():
    # List all certificates
    response = iot_client.list_certificates()
    certificates = response['certificates']

    print(f"Found {len(certificates)} certificates.")

    for cert in certificates:
        cert_id = cert['certificateId']
        status = cert['status']

        if status == 'ACTIVE':
            # Describe certificate to get PEM
            desc_response = iot_client.describe_certificate(certificateId=cert_id)
            cert_pem = desc_response['certificateDescription']['certificatePem']

            # Extract thing name from certificate (assuming CN is the thing name)
            # For simplicity, we'll name files based on cert_id, but you can map to thing names
            filename = f"{cert_id}.pem"
            filepath = os.path.join(cert_dir, filename)

            with open(filepath, 'w') as f:
                f.write(cert_pem)

            print(f"Downloaded certificate: {filename}")

if __name__ == "__main__":
    download_certificates()