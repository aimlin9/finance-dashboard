from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — JWT login, rate limited against password guessing."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Create new account, return JWT tokens."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — View or update current user profile."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/auth/password/change/ — Change password; requires the current one."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        current = request.data.get('current_password') or ''
        new = request.data.get('new_password') or ''

        if not request.user.check_password(current):
            return Response({'current_password': ['That is not your current password.']}, status=400)
        try:
            validate_password(new, request.user)
        except DjangoValidationError as e:
            return Response({'new_password': list(e.messages)}, status=400)

        request.user.set_password(new)
        request.user.save()
        return Response({'message': 'Password changed.'})


class DeleteAccountView(generics.GenericAPIView):
    """POST /api/auth/delete-account/ — Permanently delete the account and all its data."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        if not request.user.check_password(request.data.get('password') or ''):
            return Response({'password': ['Password is incorrect.']}, status=400)
        request.user.delete()  # Statements, transactions, budgets and goals cascade
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutView(generics.GenericAPIView):
    """POST /api/auth/logout/ — Blacklist the refresh token."""

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)
