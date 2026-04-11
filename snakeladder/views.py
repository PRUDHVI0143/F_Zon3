from django.shortcuts import render
from django.views.generic import TemplateView, View
from django.http import JsonResponse
import json
from leaderboard.models import Game, GameScore

class GameView(TemplateView):
    template_name = 'snakeladder/play.html'

class SubmitScoreView(View):
    def post(self, request, *args, **kwargs):
        game = Game.objects.get_or_create(name='Snake & Ladder', slug='snakeladder')[0]
        GameScore.objects.create(user=request.user, game=game, score=100)
        profile = request.user.profile
        profile.total_games_played += 1
        profile.save()
        return JsonResponse({'status': 'success'})
