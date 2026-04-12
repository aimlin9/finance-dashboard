from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import serializers, generics, permissions, status
from rest_framework.response import Response

User = get_user_model()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('No account with this email.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class PasswordResetRequestView(generics.GenericAPIView):
    """POST /api/auth/password-reset/ — Request a password reset."""
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data['email'])
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # In production, send this via email.
        # For now, return the reset link in the response.
        reset_url = f"http://localhost:5173/reset-password?uid={uid}&token={token}"

        # TODO: Send email with reset_url using SendGrid, Gmail SMTP, etc.
        print(f"Password reset link: {reset_url}")

        return Response({
            'message': 'Password reset link generated.',
            'reset_url': reset_url,  # Remove this in production!
        })


class PasswordResetConfirmView(generics.GenericAPIView):
    """POST /api/auth/password-reset/confirm/ — Set new password."""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({'detail': 'Invalid reset link.'}, status=400)

        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return Response({'detail': 'Reset link has expired.'}, status=400)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'message': 'Password updated successfully.'})