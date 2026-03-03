from django.shortcuts import render
from django.views.generic import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
import json
from leaderboard.models import Game, GameScore

class GameView(LoginRequiredMixin, TemplateView):
    template_name = 'chess/play.html'

class SubmitScoreView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        game = Game.objects.get_or_create(name='Chess', slug='chess')[0]
        GameScore.objects.create(user=request.user, game=game, score=200)
        profile = request.user.profile
        profile.total_games_played += 1
        profile.save()
        return JsonResponse({'status': 'success'})
