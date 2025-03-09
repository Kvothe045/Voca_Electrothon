from base64 import b64encode

from django.test import Client, TestCase
from django.utils.timezone import now, timedelta

from ..models import Key


class KeyExchangeTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = "/api/key"
        self.username = "test_user"
        self.public_key_data = open("api/keys/django_public_key.pem", "rb").read()
        self.encoded_key = b64encode(self.public_key_data).decode("utf-8")

    def test_successful_key_exchange(self):
        response = self.client.post(
            self.url,
            data={
                "timestamp": now().isoformat(),
                "key": self.encoded_key,
                "userID": self.username,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertTrue(Key.objects.filter(username=self.username).exists())

    def test_missing_required_fields(self):
        response = self.client.post(
            self.url,
            data={"timestamp": now().isoformat(), "userID": self.username},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_invalid_base64_key(self):
        response = self.client.post(
            self.url,
            data={
                "timestamp": now().isoformat(),
                "key": "invalid_base64!@#",
                "userID": self.username,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_expired_key_cleanup(self):
        # Create an expired key
        expired_key = Key.objects.create(
            username="expired_user",
            public_key="expired_key_data",
            expiry_at=now() - timedelta(days=1),
        )

        response = self.client.post(
            self.url,
            data={
                "timestamp": now().isoformat(),
                "key": self.encoded_key,
                "userID": "expired_user",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Key.objects.filter(username="expired_user", expiry_at__lt=now()).exists()
        )

    def test_reupload_key_for_same_user(self):
        # Initial upload
        self.client.post(
            self.url,
            data={
                "timestamp": now().isoformat(),
                "key": self.encoded_key,
                "userID": self.username,
            },
            content_type="application/json",
        )

        # Re-upload with different key data
        new_key_data = b64encode(b"newPublicKeyData").decode("utf-8")
        response = self.client.post(
            self.url,
            data={
                "timestamp": now().isoformat(),
                "key": new_key_data,
                "userID": self.username,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        key_obj = Key.objects.get(username=self.username)
        self.assertEqual(key_obj.public_key, "newPublicKeyData")

    def test_invalid_date_format(self):
        response = self.client.post(
            self.url,
            data={
                "timestamp": "invalid-date-format",
                "key": self.encoded_key,
                "userID": self.username,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_missing_both_required_fields(self):
        response = self.client.post(
            self.url,
            data={"timestamp": now().isoformat()},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_invalid_base64_edge_case(self):
        # Edge case: valid Base64 characters but invalid padding
        invalid_base64 = b64encode(b"invalid_padding").decode("utf-8")[
            :-2
        ]  # Remove padding
        response = self.client.post(
            self.url,
            data={
                "timestamp": now().isoformat(),
                "key": invalid_base64,
                "userID": self.username,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())
