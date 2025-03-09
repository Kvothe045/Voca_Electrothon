from typing import Tuple
from cryptography.hazmat.primitives.ciphers import Cipher, modes
from cryptography.hazmat.primitives.ciphers.algorithms import AES
from cryptography.hazmat.backends import default_backend
import os
import base64

def encrypt_aes_256_ctr(key, plaintext) -> Tuple[bytes, bytes]:
    # Generate a random 16-byte nonce
    nonce = os.urandom(16)

    # Initialize the AES cipher in CTR mode
    cipher = Cipher(AES(key), modes.CTR(nonce), backend=default_backend())
    encryptor = cipher.encryptor()

    # Encrypt the plaintext
    ciphertext: bytes = encryptor.update(plaintext) + encryptor.finalize()
    return nonce, base64.b64encode(ciphertext)

def decrypt_aes_256_ctr(key, nonce, ciphertext):
    # Initialize the AES cipher in CTR mode
    ciphertext = base64.b64decode(ciphertext)
    cipher = Cipher(AES(key), modes.CTR(nonce), backend=default_backend())
    decryptor = cipher.decryptor()

    # Decrypt the ciphertext
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    return plaintext

# Example Usage
if __name__ == "__main__":
    # AES-256 key must be 32 bytes
    key = os.urandom(32)

    plaintext = b"Albert Einstein's ideas changed the world."
    print("Original plaintext:", plaintext)

    # Encrypt
    nonce, ciphertext = encrypt_aes_256_ctr(key, plaintext)
    print("Encrypted ciphertext:", ciphertext)

    # Decrypt
    decrypted_text = decrypt_aes_256_ctr(key, nonce, ciphertext)
    print("Decrypted plaintext:", decrypted_text)

