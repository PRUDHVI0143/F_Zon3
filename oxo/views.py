from django.shortcuts import render
from django.views.generic import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
import json
from leaderboard.models import Game, GameScore

class GameView(LoginRequiredMixin, TemplateView):
    template_name = 'oxo/play.html'

class SubmitScoreView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        score_val = data.get('score', 0)
        game = Game.objects.get_or_create(name='OXO', slug='oxo')[0]
        
        GameScore.objects.create(
            user=request.user,
            game=game,
            score=score_val
        )
        
        profile = request.user.profile
        profile.total_games_played += 1
        if score_val > 0: # winner
            profile.total_wins += 1
        profile.save()

        return JsonResponse({'status': 'success'})
