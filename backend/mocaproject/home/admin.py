# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import User, Work, Message

# Register your models here.

admin.site.register(User)
admin.site.register(Work)
admin.site.register(Message)
