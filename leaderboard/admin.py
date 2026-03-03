from django.contrib import admin
from .models import Game, GameScore, Leaderboard

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')

@admin.register(GameScore)
class GameScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score', 'achieved_at')
    list_filter = ('game', 'user')
    ordering = ('-score',)
