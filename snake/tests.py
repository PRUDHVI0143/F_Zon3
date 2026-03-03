from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
import json
from leaderboard.models import Game, GameScore

class SnakeGameTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='player1', password='password123')
        self.game = Game.objects.get_or_create(name='Snake', slug='snake')[0]
        
    def test_play_view_requires_login(self):
        """Test snake game play view requires login."""
        response = self.client.get(reverse('snake:play'))
        # Should redirect to login (status 302)
        self.assertEqual(response.status_code, 302)

    def test_score_submission_ajax(self):
        """Test score submission via AJAX."""
        self.client.login(username='player1', password='password123')
        score_data = {'score': 150}
        response = self.client.post(
            reverse('snake:submit_score'), 
            data=json.dumps(score_data), 
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'success')
        
        # Verify score is in database
        score_entry = GameScore.objects.filter(user=self.user, game=self.game).first()
        self.assertIsNotNone(score_entry)
        self.assertEqual(score_entry.score, 150)
        
        # Verify profile is updated
        profile = self.user.profile
        profile.refresh_from_db()
        self.assertEqual(profile.total_games_played, 1)
        self.assertEqual(profile.total_score, 150)
