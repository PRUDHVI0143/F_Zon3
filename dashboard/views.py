from django.shortcuts import render
from django.views.generic import TemplateView
from leaderboard.models import Game, GameScore

class HomeView(TemplateView):
    template_name = 'dashboard/home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['games'] = Game.objects.all()
        
        if self.request.user.is_authenticated:
            context['recent_scores'] = GameScore.objects.filter(user=self.request.user).select_related('game').order_by('-achieved_at')[:5]
            context['total_played'] = self.request.user.profile.total_games_played
        else:
            context['recent_scores'] = []
            context['total_played'] = 0
            
        return context

def error_404(request, exception):
    return render(request, '404.html', status=404)

def error_500(request):
    return render(request, '500.html', status=500)

class AnalyticsView(TemplateView):
    template_name = 'dashboard/analytics.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from django.db.models import Count, Max
        from leaderboard.models import GameScore, Game
        
        context['total_games_all'] = GameScore.objects.count()
        most_played = GameScore.objects.values('game__name').annotate(count=Count('game')).order_by('-count').first()
        context['most_played_game'] = most_played['game__name'] if most_played else "None"
        
        top_user = GameScore.objects.values('user__username').annotate(total=Count('id')).order_by('-total').first()
        context['top_user'] = top_user['user__username'] if top_user else "None"
        
        # Chart Data
        game_stats = GameScore.objects.values('game__name').annotate(count=Count('id'))
        context['chart_labels'] = [g['game__name'] for g in game_stats]
        context['chart_data'] = [g['count'] for g in game_stats]
        
        return context
