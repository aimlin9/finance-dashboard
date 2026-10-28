import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import serializers, generics, permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

User = get_user_model()
logger = logging.getLogger(__name__)

GENERIC_RESET_MESSAGE = 'If an account exists for that email, a reset link is on its way.'


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class PasswordResetRequestView(generics.GenericAPIView):
    """
    POST /api/auth/password-reset/ — Request a password reset.

    Always answers the same way, so it can't be used to find out who has an
    account. The link is emailed; it is only returned in the response when
    DEBUG is on, for local development without an email server.
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(email__iexact=serializer.validated_data['email'], is_active=True).first()
        if not user:
            return Response({'message': GENERIC_RESET_MESSAGE})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        try:
            send_mail(
                subject='Reset your FinTrack Ghana password',
                message=(
                    f"Hi {user.full_name.split(' ')[0] or 'there'},\n\n"
                    f"Use this link to choose a new password:\n{reset_url}\n\n"
                    "The link stops working once it's used or after a few days. "
                    "If you didn't ask for this, you can ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )
        except Exception:
            logger.exception('Could not send password reset email')

        data = {'message': GENERIC_RESET_MESSAGE}
        if settings.DEBUG:
            data['reset_url'] = reset_url
        return Response(data)


class PasswordResetConfirmView(generics.GenericAPIView):
    """POST /api/auth/password-reset/confirm/ — Set new password."""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist, Exception):
            return Response({'detail': 'Invalid reset link.'}, status=400)

        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return Response({'detail': 'This reset link has expired or was already used.'}, status=400)

        try:
            validate_password(serializer.validated_data['new_password'], user)
        except Exception as e:
            return Response({'new_password': list(getattr(e, 'messages', [str(e)]))}, status=400)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'message': 'Password updated successfully.'})
