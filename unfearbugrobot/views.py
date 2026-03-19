from django.shortcuts import render
from django.views.generic import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
import json
from leaderboard.models import Game, GameScore

class GameView(LoginRequiredMixin, TemplateView):
    template_name = 'unfearbugrobot/play.html'

class SubmitScoreView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        score_val = data.get('score', 0)
        game = Game.objects.get(slug='unfearbugrobot')
        GameScore.objects.create(user=request.user, game=game, score=score_val)
        profile = request.user.profile
        profile.total_games_played += 1
        if score_val > profile.total_score:
            profile.total_score = score_val
        profile.save()
        return JsonResponse({'status': 'success'})
