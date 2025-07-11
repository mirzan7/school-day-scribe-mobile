from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/homework/notifications/$', consumers.HomeworkNotificationConsumer.as_asgi()),
]