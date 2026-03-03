from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='games/', blank=True)
    
    def __str__(self):
        return self.name

class GameScore(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scores')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField(default=0, db_index=True)
    achieved_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-score', '-achieved_at']
        indexes = [
            models.Index(fields=['-score', '-achieved_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.game.name}: {self.score}"

class MatchResult(models.Model):
    GAME_RESULT_CHOICES = [
        ('win', 'Win'),
        ('loss', 'Loss'),
        ('draw', 'Draw'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='matches')
    result = models.CharField(max_length=10, choices=GAME_RESULT_CHOICES)
    played_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.game.name}: {self.result}"

class Leaderboard(models.Model):
    game = models.OneToOneField(Game, on_delete=models.CASCADE, related_name='leaderboard')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Leaderboard for {self.game.name}"

    def get_top_players(self, limit=10):
        return GameScore.objects.filter(game=self.game).order_by('-score')[:limit]
