import json
from unittest.mock import patch

from django.test import Client, TestCase
from django.urls import reverse

from ..models import User, vocaUser


class RegisterAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse("register")  # Ensure the URL name is set in your urls.py
        self.valid_data = {
            "data": [
                {
                    "username": "testuser",
                    "firstName": "Test",
                    "lastName": "User",
                    "email": "testuser@example.com",
                    "password": "strongpassword123",
                    "gender": "non-binary",
                    "country": "Wonderland",
                }
            ]
        }

    @patch("api.Views.aws.KeyManagementService.store_nonce")
    @patch("api.rsa.load_public_key")
    @patch("api.rsa.encrypt_message")
    def test_successful_registration(
        self, mock_encrypt_message, mock_load_public_key, mock_store_nonce
    ):
        mock_store_nonce.return_value = {"nonce_id": "mock_nonce_id"}
        mock_encrypt_message.return_value = "encrypted_unique_key"
        mock_load_public_key.return_value = "mock_public_key"

        response = self.client.post(
            self.url, json.dumps(self.valid_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("uniqueKey", response.json())
        self.assertTrue(response.json()["uniqueKey"])

    def test_missing_required_fields(self):
        invalid_data = {"data": [{"username": ""}]}

        response = self.client.post(
            self.url, json.dumps(invalid_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"], "Missing Parameters or invalid field lengths"
        )

    def test_invalid_email_format(self):
        invalid_data = self.valid_data.copy()
        invalid_data["data"][0]["email"] = "invalidemail"

        response = self.client.post(
            self.url, json.dumps(invalid_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"], "Missing Parameters or invalid field lengths"
        )

    def test_username_already_exists(self):
        # First, create a User and vocaUser to simulate existing username
        user = User.objects.create(
            username="testuser",
            first_name="Test",
            last_name="User",
            email="testuser@example.com",
            password="hashedpassword",
        )

        # Assuming vocaUser.hash_username is how usernames are stored in vocaUser
        salt = vocaUser.generate_salt()
        hashed_username = vocaUser.hash_username("testuser", salt)

        vocaUser.objects.create(
            user=user,
            username_hash=hashed_username,
            unique_key="dummy_key",
            gender="non-binary",
            country="Testland",
            aws_key_id="dummy_aws_key",
        )

        response = self.client.post(
            self.url,
            data=json.dumps(self.valid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "Username already taken"})

    def test_password_too_short(self):
        invalid_data = self.valid_data.copy()
        invalid_data["data"][0]["password"] = "short"

        response = self.client.post(
            self.url, json.dumps(invalid_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"], "Missing Parameters or invalid field lengths"
        )

    @patch(
        "api.Views.register.Register._encrypt_data",
        side_effect=Exception("Unexpected error"),
    )
    def test_internal_server_error(self, mock_encrypt_data):
        response = self.client.post(
            self.url, json.dumps(self.valid_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["error"], "Could not process request")

    def test_invalid_json_data(self):
        invalid_json = '{"data": [}'  # malformed JSON

        response = self.client.post(
            self.url, invalid_json, content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "error parsing data")

    def test_password_too_short(self):
        invalid_payload = self.valid_data.copy()
        invalid_payload["data"][0]["password"] = "short"

        response = self.client.post(
            self.url, data=json.dumps(invalid_payload), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"error": "Missing Parameters or invalid field lengths"}
        )

    def test_invalid_email_format(self):
        invalid_payload = self.valid_data.copy()
        invalid_payload["data"][0]["email"] = "invalid-email-format"

        response = self.client.post(
            self.url, data=json.dumps(invalid_payload), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"error": "Missing Parameters or invalid field lengths"}
        )

    def test_successful_registration_missing_optional_fields(self):
        minimal_payload = {
            "data": [
                {
                    "username": "minimaluser",
                    "firstName": "Minimal",
                    "lastName": "User",
                    "email": "minimaluser@example.com",
                    "password": "strongpassword",
                    # gender and country are missing (optional fields)
                }
            ]
        }

        response = self.client.post(
            self.url, data=json.dumps(minimal_payload), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("uniqueKey", response.json())
        self.assertTrue(response.json()["uniqueKey"])

    def test_non_utf8_encoded_data(self):
        non_utf8_data = '{"data": [{"username": "testuser"}]}'.encode(
            "utf-16"
        )  # Incorrect encoding

        response = self.client.post(
            self.url, data=non_utf8_data, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "error parsing data"})

    def test_long_username(self):
        invalid_payload = self.valid_data.copy()
        invalid_payload["data"][0]["username"] = (
            "a" * 31
        )  # Username exceeds 30 characters

        response = self.client.post(
            self.url, data=json.dumps(invalid_payload), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"error": "Missing Parameters or invalid field lengths"}
        )

    def test_missing_data_key(self):
        invalid_payload = {"wrong_key": self.valid_data["data"]}

        response = self.client.post(
            self.url, data=json.dumps(invalid_payload), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "error parsing data"})

    def test_empty_request_body(self):
        response = self.client.post(
            self.url, data=json.dumps({}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "error parsing data"})
