from django.urls import path
from . import views

app_name = 'leaderboard'

urlpatterns = [
    path('', views.GlobalLeaderboardView.as_view(), name='global'),
    path('game/<str:game_name>/', views.GameLeaderboardView.as_view(), name='game_detail'),
]
