import subprocess
import os

# Directory to store certificates
cert_dir = os.path.dirname(os.path.abspath(__file__))

# Generate keys and CSRs for 5 devices
for i in range(1, 6):
    device_name = f"rpi-{i:03d}"
    key_file = os.path.join(cert_dir, f"{device_name}.key")
    csr_file = os.path.join(cert_dir, f"{device_name}.csr")

    print(f"Generating key for {device_name}...")
    # Generate RSA private key
    subprocess.run([
        "openssl", "genrsa", "-out", key_file, "2048"
    ], check=True)

    print(f"Generating CSR for {device_name}...")
    # Generate Certificate Signing Request
    subprocess.run([
        "openssl", "req", "-new", "-key", key_file, "-out", csr_file,
        "-subj", f"/CN={device_name}/O=elemental_iot/C=IN"
    ], check=True)

print("All keys and CSRs generated successfully!")
