from django.contrib import admin

from .models import MyUser, Salon, Message
admin.site.register(MyUser)
admin.site.register(Salon)
admin.site.register(Message)
