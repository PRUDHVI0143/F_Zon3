from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import UserProfile

class AccountsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='password123')
        
    def test_profile_creation(self):
        """Test if UserProfile is created automatically via signals."""
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())

    def test_login_view(self):
        """Test login functionality."""
        response = self.client.post(reverse('accounts:login'), {
            'username': 'testuser',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, 302) # Redirect to home

    def test_profile_view_requires_login(self):
        """Test profile access requires login."""
        response = self.client.get(reverse('accounts:profile'))
        self.assertEqual(response.status_code, 302) # Redirect to login
        
    def test_profile_view_authenticated(self):
        """Test profile access when logged in."""
        self.client.login(username='testuser', password='password123')
        response = self.client.get(reverse('accounts:profile'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'testuser')
