from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, DetailView
from .models import Game, GameScore

class GlobalLeaderboardView(ListView):
    model = GameScore
    template_name = 'leaderboard/global.html'
    context_object_name = 'top_scores'
    queryset = GameScore.objects.all().order_by('-score')[:50]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Optimized: Use prefetch_related for related scores
        # We want the top score for EACH game.
        from django.db.models import OuterRef, Subquery
        from .models import GameScore, Game
        
        # Subquery to get the highest score ID for each game
        top_score_ids = GameScore.objects.filter(
            game=OuterRef('pk')
        ).order_by('-score').values('id')[:1]
        
        # Fetch games and their top scores in a single query (using the subquery)
        games_with_toppers = Game.objects.annotate(
            top_score_id=Subquery(top_score_ids)
        ).filter(top_score_id__isnull=False).select_related('leaderboard')
        
        # Now fetch the actual score objects efficiently
        topper_ids = [g.top_score_id for g in games_with_toppers]
        topper_scores = GameScore.objects.filter(id__in=topper_ids).select_related('game', 'user')
        
        context['game_toppers'] = [{'game': s.game, 'score': s} for s in topper_scores]
        return context

class GameLeaderboardView(DetailView):
    model = Game
    template_name = 'leaderboard/game_detail.html'
    slug_field = 'slug'
    slug_url_kwarg = 'game_name'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['top_scores'] = GameScore.objects.filter(game=self.object).order_by('-score')[:10]
        return context
