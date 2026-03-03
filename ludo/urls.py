from django.urls import path
from . import views

app_name = 'ludo'

urlpatterns = [
    path('', views.GameView.as_view(), name='play'),
    path('submit-score/', views.SubmitScoreView.as_view(), name='submit_score'),
]
