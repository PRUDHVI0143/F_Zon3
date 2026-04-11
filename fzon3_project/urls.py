from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic.base import RedirectView

urlpatterns = [
    re_path(r'^favicon\.ico$', RedirectView.as_view(url='/static/favicon.ico', permanent=True)),
    re_path(r'^favicon\.png$', RedirectView.as_view(url='/static/favicon.png', permanent=True)),
    path('admin/', admin.site.admin_url if hasattr(admin.site, 'admin_url') else admin.site.urls), # standard way
    path('', include('dashboard.urls')),
    path('accounts/', include('accounts.urls')),
    path('ludo/', include('ludo.urls')),
    path('snake/', include('snake.urls')),
    path('reddot/', include('reddot.urls')),
    path('snakeladder/', include('snakeladder.urls')),
    path('chess/', include('chess.urls')),
    path('oxo/', include('oxo.urls')),
    path('leaderboard/', include('leaderboard.urls')),
    path('sudoku/', include('sudoku.urls')),
    path('memorymatch/', include('memorymatch.urls')),
    path('game2048/', include('game2048.urls')),
    path('minesweeper/', include('minesweeper.urls')),
    path('whackamole/', include('whackamole.urls')),
    path('aimtrainer/', include('aimtrainer.urls')),
    path('typingtest/', include('typingtest.urls')),
    path('colorswitch/', include('colorswitch.urls')),
    path('checkers/', include('checkers.urls')),
    path('connect4/', include('connect4.urls')),
    path('flappybird/', include('flappybird.urls')),
    path('breakout/', include('breakout.urls')),
    path('spaceshooter/', include('spaceshooter.urls')),
    path('endlessrunner/', include('endlessrunner.urls')),
    path('unfearbugrobot/', include('unfearbugrobot.urls')),
    path('spacefighter/', include('spacefighter.urls')),
    path('dungeonquest/', include('dungeonquest.urls')),
    path('pacmaze/', include('pacmaze.urls')),
]

handler404 = 'dashboard.views.error_404'
handler500 = 'dashboard.views.error_500'

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
