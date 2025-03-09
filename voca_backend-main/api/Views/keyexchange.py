# dependency imports
import json
import logging
import os
from base64 import b64decode, b64encode, decode
from datetime import datetime
from typing import Optional

from dateutil.parser import isoparse

# django imports
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.utils.timezone import now, timedelta
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View

# local imports
from ..models import Key

# Ensure key directory exists
KEY_DIR = "api/keys"
os.makedirs(KEY_DIR, exist_ok=True)


@method_decorator(csrf_exempt, name="dispatch")
class KeyExchange(View):
    def post(self, request):
        try:
            data: Optional[dict] = self._parse_request_data(request)
            if data is None:
                return JsonResponse({"error": "Invalid JSON data"}, status=400)

            data = self._extract_data(data)
            if not data["pubkey"] or not data["username"]:
                return JsonResponse({"error": "Missing required fields"}, status=400)

            if not self._is_iso_format(data["timestamp"]):
                return JsonResponse({"error": "Invalid format"}, status=400)

            # Check if the key exists and is expired
            self._cleanup_expired_key(data["username"])

            # Validate Base64 Encoding
            try:
                decoded_pubkey = b64decode(data["pubkey"], validate=True)
            except ValueError:
                return JsonResponse(
                    {"error": "Invalid public key encoding"}, status=400
                )

            # Save public key in the database
            Key.objects.update_or_create(
                username=data["username"],
                defaults={
                    "public_key": decoded_pubkey.decode("utf-8"),
                    "expiry_at": now() + timedelta(days=1),
                },
            )

            return JsonResponse(
                {
                    "message": "Key saved successfully",
                    "pubkey": b64encode(
                        open(os.path.join(KEY_DIR, "node_private_key.pem"), "rb").read()
                    ).decode("utf-8"),
                },
                status=200,
            )

        except Exception as e:
            logging.error(f"An error occurred: {e}", exc_info=True)
            return JsonResponse({"error": "Could not process request"}, status=500)

    def _parse_request_data(self, request) -> Optional[dict]:
        try:
            return json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            logging.error("Error parsing request data")
            return None

    def _extract_data(self, json_data: dict) -> dict:
        return {
            "timestamp": json_data.get("timestamp"),
            "pubkey": json_data.get("key"),
            "username": json_data.get("userID"),
        }

    def _is_iso_format(self, timestamp: str):
        try:
            if isoparse(timestamp):
                return True
        except Exception:
            return False

    def _cleanup_expired_key(self, username):
        key = Key.objects.filter(username=username).first()
        if key and (key.expiry_at < now()):
            key.delete()
