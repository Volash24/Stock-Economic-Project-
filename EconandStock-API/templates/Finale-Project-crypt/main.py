import os
import json
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hmac, hashes
from cryptography.hazmat.primitives.padding import PKCS7
from cryptography.exceptions import InvalidSignature
from datetime import datetime
import secrets
import string

# Constants
SALT_SIZE = 16
NONCE_SIZE = 16
KEY_SIZE = 64
BLOCK_SIZE = 128

# File paths
MASTER_PASS_FILE = "master_pass.json"
DATA_FILE = "master_data.json"
BACKUP_KEY_FILE = "backup_key.json"
PRIVATE_KEY_FILE = "private_key.pem"
LOG_FILE = "log.txt"


class PasswordManager:
    def __init__(self):
        self.enc_key = None
        self.hmac_key = None

    def log_action(self, action, success=True):
        """Log actions to a file."""
        with open(LOG_FILE, "a") as log_file:
            log_file.write(f"{action} - {'Success' if success else 'Failed'} - {self.get_current_time()}\n")

    def get_current_time(self):
        """Get the current timestamp."""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def hash_pass(self, password):
        """Hash the password with Scrypt."""
        salt = os.urandom(SALT_SIZE)
        kdf = Scrypt(salt=salt, length=KEY_SIZE, n=2**14, r=8, p=1)
        key = kdf.derive(password.encode())
        return salt, key

    def validate_password_strength(self, password):
        """Ensure password meets strength requirements."""
        if len(password) < 8 or not any(c.isdigit() for c in password) or not any(c.islower() for c in password) or not any(c.isupper() for c in password):
            print("Password must be at least 8 characters long, include uppercase, lowercase, and a number.")
            return False
        return True

    def verify_pass(self, password, salt, stored_hash):
        """Verify if the entered password matches the stored hash."""
        try:
            kdf_verify = Scrypt(salt=salt, length=KEY_SIZE, n=2**14, r=8, p=1)
            kdf_verify.verify(password.encode(), stored_hash)  # Verify the hash matches
            return True
        except Exception as e:
            print(f"Debug: Verification failed: {e}")  # Debugging line
            return False

    def signup(self):
        """Create a new master password."""
        while True:
            master_pass = input("Create a master password: ").strip()
            if self.validate_password_strength(master_pass):
                break
        confirm_pass = input("Confirm master password: ").strip()
        if master_pass != confirm_pass:
            print("Passwords do not match.")
            return

        # Hash the master password
        salt, master_key = self.hash_pass(master_pass)
        hashed_pass = master_key[:32]  # Store only the first 32 bytes as the hashed password

        # Save to file
        master_data = {
            "salt": base64.b64encode(salt).decode(),
            "hashed_pass": base64.b64encode(hashed_pass).decode(),
        }
        with open(MASTER_PASS_FILE, "w") as f:
            json.dump(master_data, f)

        print("Master password created successfully.")
        self.log_action("Signup", success=True)

    def signin(self):
        """Authenticate the user."""
        try:
            with open(MASTER_PASS_FILE, "r") as f:
                master_data = json.load(f)
                salt = base64.b64decode(master_data["salt"])
                stored_hash = base64.b64decode(master_data["hashed_pass"])

                print(f"Debug: Stored salt: {salt}")
                print(f"Debug: Stored hashed password: {stored_hash}")

            for attempt in range(3):
                master_pass = input("Enter your master password: ").strip()
                print(f"Debug: Entered password: {master_pass}")

                kdf = Scrypt(salt=salt, length=KEY_SIZE, n=2**14, r=8, p=1)
                try:
                    derived_key = kdf.derive(master_pass.encode())
                    print(f"Debug: Derived key: {derived_key[:32]}")

                    if derived_key[:32] == stored_hash:
                        print("Authentication successful.")
                        self.enc_key = derived_key[:32]
                        self.hmac_key = derived_key[32:]
                        self.log_action("Sign in", success=True)
                        return True
                    else:
                        print("Debug: Keys do not match.")
                except Exception as e:
                    print(f"Debug: Verification failed: {e}")

                print(f"Invalid password. {2 - attempt} attempts remaining.")
            print("Too many failed attempts.")
            self.log_action("Sign in", success=False)
        except FileNotFoundError:
            print("No master password found. Please sign up first.")
        return False

    def add_service(self):
        """Add a new service and password."""
        if not self.enc_key:
            print("You must sign in first.")
            return

        service_name = input("Enter the service name: ").strip()
        password = input("Enter the password for this service: ").strip()

        encrypted_service_name = self.encrypt_service_name(service_name)
        encrypted_password, nonce = self.encrypt_pass(password)

        # Save data
        data = self.load_data()
        data[base64.b64encode(encrypted_service_name).decode()] = {
            "encrypted_password": base64.b64encode(encrypted_password).decode(),
            "nonce": base64.b64encode(nonce).decode(),
        }
        self.save_data(data)
        print(f"Service '{service_name}' added successfully.")

    def encrypt_service_name(self, service_name):
        """Encrypt the service name using AES-ECB with PKCS7 padding."""
        cipher = Cipher(algorithms.AES(self.enc_key), modes.ECB())
        encryptor = cipher.encryptor()

        padder = PKCS7(BLOCK_SIZE).padder()
        padded_service_name = padder.update(service_name.encode()) + padder.finalize()

        return encryptor.update(padded_service_name) + encryptor.finalize()

    def encrypt_pass(self, password):
        """Encrypt a password."""
        nonce = os.urandom(NONCE_SIZE)
        cipher = Cipher(algorithms.AES(self.enc_key), modes.CTR(nonce))
        encryptor = cipher.encryptor()
        return encryptor.update(password.encode()), nonce

    def load_data(self):
        """Load stored data."""
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        return {}

    def save_data(self, data):
        """Save encrypted data."""
        with open(DATA_FILE, "w") as f:
            json.dump(data, f)

    def run(self):
        """Run the password manager."""
        while True:
            print("\nOptions:")
            print("1. Sign Up")
            print("2. Sign In")
            print("3. Add Service")
            print("4. Exit")
            choice = input("Enter your choice: ").strip()

            if choice == "1":
                self.signup()
            elif choice == "2":
                if self.signin():
                    print("Sign-in successful.")
            elif choice == "3":
                self.add_service()
            elif choice == "4":
                print("Exiting.")
                break
            else:
                print("Invalid choice. Try again.")


if __name__ == "__main__":
    manager = PasswordManager()
    manager.run()
