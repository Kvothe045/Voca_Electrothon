import base64

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def load_private_key(key_str):
    return serialization.load_pem_private_key(
        key_str, password=None, backend=default_backend()
    )


def load_public_key(key_str):
    return serialization.load_pem_public_key(key_str, backend=default_backend())


def encrypt_message(message, public_key):
    encrypted_message = public_key.encrypt(
        message.encode(),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(encrypted_message).decode()


def decrypt_message(encrypted_message, private_key):
    encrypted_message = base64.b64decode(encrypted_message)
    decrypted_message = private_key.decrypt(
        encrypted_message,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return decrypted_message.decode()
