import os
from datetime import datetime, timedelta

from django.contrib.auth.hashers import Argon2PasswordHasher, check_password
from django.contrib.auth.models import User
from django.db import models
from django.utils.autoreload import time


class vocaUser(models.Model):
    user = models.ForeignKey(to=User, on_delete=models.CASCADE)
    username_hash = models.CharField(max_length=256, unique=True, editable=False)
    unique_key = models.CharField(max_length=512, editable=False)
    country = models.CharField(max_length=70, default="Not Provided", editable=True)
    gender = models.CharField(max_length=15, default="Not Provided")
    aws_key_id = models.CharField(max_length=36)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def hash_username(username: str, salt: bytes) -> str:
        """Hashes the username using Argon2."""
        hasher = Argon2PasswordHasher()
        return hasher.encode(password=username, salt=salt.hex())  # No iterations needed

    @staticmethod
    def generate_salt() -> bytes:
        """Generates a random salt for hashing."""
        return os.urandom(16)

    @staticmethod
    def username_exists(username: str) -> bool:
        """Checks if a hashed username already exists in the database."""
        for user in vocaUser.objects.all():
            if check_password(username, user.username_hash):
                return True
        return False

    def __str__(self):
        return f"{self.username_hash}"

    class Meta:
        verbose_name = "voca user"
        verbose_name_plural = "voca users"


class Report(models.Model):
    reportFile = models.FileField(upload_to="reports/")
    reportID = models.CharField(max_length=256, primary_key=True)
    owner = models.ForeignKey(
        vocaUser, on_delete=models.CASCADE, related_name="reports"
    )
    activity = models.CharField(max_length=50)

    def __str__(self) -> str:
        return f"{self.owner.__str__()} on {self.activity}"


class Key(models.Model):
    username = models.CharField(max_length=512, primary_key=True)
    public_key = models.TextField()  # Stores the full PEM-formatted public key
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expiry_at = models.DateTimeField(default=datetime.now() + timedelta(minutes=10))

    def __str__(self):
        return f"Public Key for {self.username}"
