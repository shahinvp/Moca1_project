from rest_framework import serializers
from home.models import Work


class WorkSerializer(serializers.ModelSerializer):

    class Meta:
        model = Work
        fields = "__all__"