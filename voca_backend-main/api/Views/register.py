# dependency imports
import hashlib
import json
import logging
import re
import secrets
import uuid
from os import urandom
from typing import Optional

# django imports
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View

# local imports
from ..aes import encrypt_aes_256_ctr
from ..models import User, vocaUser
from ..rsa import encrypt_message, load_public_key
from .aws import KeyManagementService

EMAIL_REGEX = r"^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$"


@method_decorator(csrf_exempt, name="dispatch")
class Register(View):
    def __init__(self):
        super().__init__()
        self.key_service = KeyManagementService()

    def post(self, request) -> JsonResponse:
        try:
            if not (json_data := self._parse_request_data(request)):
                return JsonResponse({"error": "error parsing data"}, status=400)

            user_data = self._extract_user_data(json_data)

            if not self._validate_required_fields(user_data):
                return JsonResponse(
                    {"error": "Missing Parameters or invalid field lengths"}, status=400
                )

            # Generate a unique salt and hash the username
            salt = vocaUser.generate_salt()
            hashed_username = vocaUser.hash_username(user_data["username"], salt)

            # Check if the username already exists
            if vocaUser.username_exists(user_data["username"]):
                return JsonResponse({"error": "Username already taken"}, status=400)

            # Generate encryption key and unique key
            encryption_key = urandom(32)
            unique_key = self._generate_unique_key(user_data["username"])
            user_data['unique_key'] = unique_key

            # Encrypt user data
            #encrypted_data = self._encrypt_data(user_data, encryption_key)
            #if encrypted_data is None:
            #    return JsonResponse({"error": "error parsing data"}, status=400)

            # Create user and get user ID
            user_obj = self._create_user(user_data)

            # Create vocaUser with additional AWS key reference
            self._create_voca_user(
                user_obj, hashed_username, user_data["unique_key"], user_data, encryption_key
            )

            # Return encrypted unique key
            encrypted_key = encrypt_message(
                unique_key,
                load_public_key(open("api/keys/django_public_key.pem", "rb").read()),
            )
            return JsonResponse({"uniqueKey": encrypted_key}, status=200)

        except IntegrityError:
            logging.error("Username is already taken", exc_info=True)
            return JsonResponse({"error": "Username is already taken"}, status=400)
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}", exc_info=True)
            return JsonResponse({"error": "Could not process request"}, status=500)

    def _encrypt_data(self, user_data: dict, key: bytes) -> Optional[dict[str, bytes]]:
        if not isinstance(user_data, dict):
            return None

        aws_json = {}

        encrypted_data = {}
        for k, v in user_data.items():
            if isinstance(v, str):
                v = v.encode("utf-8")
            elif not isinstance(v, bytes):
                return None

            # Encrypt the value and store nonce in AWS
            nonce, ciphertext = encrypt_aes_256_ctr(key, v)

            encrypted_data[k] = ciphertext
            aws_json[k] = nonce

        print(aws_json)

        try:
            nonce_data = self.key_service.store_nonce(
                nonce=bytes(f"{aws_json}", encoding='UTF-8'),
                user_id=f"{user_data['username']}"
            )
            print(nonce_data)
        except Exception as e:
            logging.error(f"Error storing nonce: {str(e)}")
            return None


        return encrypted_data

    def _parse_request_data(self, request):
        try:
            decoded_body = request.body.decode("utf-8")
            parsed_json = json.loads(decoded_body)
            return parsed_json.get("data")[0]
        except (
            json.JSONDecodeError,
            IndexError,
            KeyError,
            TypeError,
            UnicodeDecodeError,
        ) as e:
            logging.error(f"Error parsing request data: {e}")
            return False

    def _extract_user_data(self, json_data):
        return {
            "username": json_data.get("username"),
            "first_name": json_data.get("firstName"),
            "last_name": json_data.get("lastName"),
            "email": json_data.get("email"),
            "password": json_data.get("password"),
            "gender": json_data.get("gender", "not provided"),
            "country": json_data.get("country", "not provided"),
        }

    def _create_user(self, user_data):
        return User.objects.create(
            username=user_data.get("username"),
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            email=user_data.get("email"),
            password=make_password(user_data.get("password")),
        )

    def _generate_unique_key(self, username):
        voca_uuid = uuid.uuid4()
        salt = secrets.token_hex(16)
        data = f"{salt}{voca_uuid}{username}"
        sha3_512 = hashlib.sha3_512()
        sha3_512.update(data.encode("utf-8"))
        return sha3_512.hexdigest()

    def _create_voca_user(
        self, user_obj, hashed_username, unique_key, user_data, aws_key_id
    ):
        vocaUser.objects.create(
            user=user_obj,
            username_hash=hashed_username,  # Store hashed username
            unique_key=unique_key,
            gender=user_data["gender"],
            country=user_data["country"],
            aws_key_id=aws_key_id,
        )

    def _validate_required_fields(self, user_data: dict):
        if not all(user_data.values()):
            logging.error("Missing required field")
            return False
        if len(user_data.get("password")) < 8:
            return False
        if len(user_data.get("username")) > 30:
            return False
        if not re.match(EMAIL_REGEX, user_data.get("email")):
            return False
        return True
