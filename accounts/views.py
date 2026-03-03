from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.models import User
from django.views.generic import CreateView, UpdateView, DetailView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.contrib.auth.forms import UserCreationForm
from .models import UserProfile

class RegisterView(CreateView):
    form_class = UserCreationForm
    template_name = 'accounts/register.html'
    success_url = reverse_lazy('accounts:login')

    def form_valid(self, form):
        response = super().form_valid(form)
        return response

class ProfileView(LoginRequiredMixin, DetailView):
    model = UserProfile
    template_name = 'accounts/profile.html'
    context_object_name = 'profile'

    def get_object(self):
        return self.request.user.profile

class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = UserProfile
    fields = ['nickname', 'bio', 'avatar']
    template_name = 'accounts/profile_update.html'
    success_url = reverse_lazy('accounts:profile')

    def get_object(self):
        return self.request.user.profile
