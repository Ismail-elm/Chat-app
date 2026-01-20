from django.urls import path
from . import views

urlpatterns = [
    path("", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("sign_up/", views.sign_up, name="sign_up"),
    path("main/<str:name>/", views.main, name="main"),
    path("main/<str:name>/<int:salon_id>/", views.messagerie, name="messagerie"),
    path("messages/<int:salon_id>/", views.get_messages, name="get_messages"),
    path("members/<int:salon_id>/", views.get_members, name="get_members"),
    path("salons/", views.get_salons, name="get_salons"),
]