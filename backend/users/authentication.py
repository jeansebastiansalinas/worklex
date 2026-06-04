from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .Models.modelsSENA import User

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
            return User.objects.select_related('person').get(user_id=user_id)
        except (User.DoesNotExist, KeyError):
            raise InvalidToken('Token inválido o usuario no encontrado')