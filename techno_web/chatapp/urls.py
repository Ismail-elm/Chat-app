from django.urls import path
from . import views

urlpatterns = [
    path("", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("sign_up/", views.sign_up, name="sign_up"),
    path("main/<str:name>/", views.main, name="main"),
    path("main/<str:name>/<int:salon_id>/", views.messagerie, name="messagerie"),
    path('chat/<int:salon_id>/data/', views.get_chat_data, name='get_chat_data'),
]
