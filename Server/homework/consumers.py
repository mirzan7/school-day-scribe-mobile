import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User

class HomeworkNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Join user-specific group
        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to homework notifications'
        }))
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
        except json.JSONDecodeError:
            pass
    
    async def homework_notification(self, event):
        """Handle homework notification from group"""
        notification = event['notification']
        
        await self.send(text_data=json.dumps({
            'type': 'homework_notification',
            'notification': notification
        }))
    
    async def homework_update(self, event):
        """Handle homework status updates"""
        update = event['update']
        
        await self.send(text_data=json.dumps({
            'type': 'homework_update',
            'update': update
        }))