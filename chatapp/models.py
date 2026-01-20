from django.db import models
import datetime
from django.utils import timezone

class MyUser(models.Model) :
    username_text = models.CharField(max_length=100, unique=True)
    password_text = models.CharField(max_length=100)
    def __str__(self):
        return self.username_text

class Salon(models.Model) :
    creator = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    members = models.ManyToManyField(MyUser, related_name="joined_salons")
    salon_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.salon_name

class Message(models.Model) :
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE)
    message_text = models.CharField(max_length=1000)
    written_at = models.DateTimeField(auto_now_add=True) 
    def __str__(self):
        return f"{self.user.username_text}: {self.message_text[:20]}"
