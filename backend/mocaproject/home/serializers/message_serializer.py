from rest_framework import serializers

from home.models import Message


class MessageSerializer(serializers.ModelSerializer):
    body = serializers.CharField(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    receiver_name = serializers.CharField(source="receiver.username", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_name",
            "receiver",
            "receiver_name",
            "body",
            "created_at",
            "edited_at",
            "seen_at",
        ]
