import base64
import os

import requests
from django.conf import settings

API_KEY = {"api-key": os.getenv("AWS_API_KEY")}


class KeyManagementService:
    def __init__(self):
        self.api_url = settings.AWS_KEY_MANAGEMENT_API_URL

    def store_aes_key(self, key, user_id):
        response = requests.post(
            f"{self.api_url}/keys",
            headers=API_KEY,
            json={
                "key": base64.b64encode(key).decode(),
                "type": "AES_KEY",
                "user_id": str(user_id),
            },
        )
        return response.json()

    def store_nonce(self, nonce, user_id):
        response = requests.post(
            f"{self.api_url}/nonces",
            headers=API_KEY,
            json={
                "nonce": base64.b64encode(nonce).decode(),
                "user_id": str(user_id),
                "purpose": "AES_CTR",
            },
        )
        return response.json()

    def get_aes_key(self, key_id, user_id):
        response = requests.get(
            f"{self.api_url}/keys",
            headers=API_KEY,
            params={"key_id": key_id, "user_id": str(user_id), "type": "AES_KEY"},
        )
        return response.json()

    def get_nonce(self, nonce_id, user_id):
        response = requests.get(
            f"{self.api_url}/nonces",
            headers=API_KEY,
            params={"nonce_id": nonce_id, "user_id": str(user_id)},
        )
        return response.json()
