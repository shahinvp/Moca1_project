import base64
import hashlib
import hmac
import os

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('manager', 'Manager'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='employee'   # 👈 this makes everyone employee by default
    )

    is_approved = models.BooleanField(default=False)




class Work(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()

    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="manager_works"
    )

    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="employee_works"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


def _message_keystream(length, salt):
    key = settings.SECRET_KEY.encode("utf-8")
    seed = hashlib.sha256(key + b":moca-private-message:" + salt).digest()
    chunks = []
    counter = 0

    while sum(len(chunk) for chunk in chunks) < length:
        counter_bytes = counter.to_bytes(4, "big")
        chunks.append(hmac.new(key, seed + counter_bytes, hashlib.sha256).digest())
        counter += 1

    return b"".join(chunks)[:length]


def encrypt_message(plain_text):
    plain_bytes = plain_text.encode("utf-8")
    salt = os.urandom(16)
    stream = _message_keystream(len(plain_bytes), salt)
    encrypted = bytes(a ^ b for a, b in zip(plain_bytes, stream))
    return base64.urlsafe_b64encode(salt + encrypted).decode("ascii")


def decrypt_message(encrypted_text):
    payload = base64.urlsafe_b64decode(encrypted_text.encode("ascii"))
    salt = payload[:16]
    encrypted_bytes = payload[16:]
    stream = _message_keystream(len(encrypted_bytes), salt)
    plain = bytes(a ^ b for a, b in zip(encrypted_bytes, stream))
    return plain.decode("utf-8")


class Message(models.Model):
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )
    encrypted_body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    seen_at = models.DateTimeField(null=True, blank=True)

    @property
    def body(self):
        return decrypt_message(self.encrypted_body)

    def set_body(self, plain_text):
        self.encrypted_body = encrypt_message(plain_text)

    def __str__(self):
        return f"{self.sender_id} -> {self.receiver_id}"
