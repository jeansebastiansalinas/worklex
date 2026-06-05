from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password
from django.db import transaction

from ..Models.modelsSENA import Person, User, TestResult
from ..serializers import (
    RegisterSerializer,
    LoginSerializer,
    TestResultSerializer,
)


# ─── Utilidad: generar tokens JWT ────────────────────────────────────────────

def get_tokens_for_user(user: User):
    """Genera access y refresh token para un User del modelo propio"""
    refresh = RefreshToken()
    refresh['user_id'] = user.user_id
    refresh['role']    = user.role_id
    refresh['email']   = user.person.email
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


def build_user_payload(user: User) -> dict:
    """Construye el dict de usuario que se envía al frontend"""
    return {
        'id':          str(user.user_id),
        'name':        f"{user.person.first_name} {user.person.last_name}",
        'email':       user.person.email,
        'role':        user.role_id,
        'status':      user.status,
        'permissions': get_permissions_for_role(user.role_id),
    }


def get_permissions_for_role(role: str) -> list:
    """Devuelve los permisos según el rol"""
    permissions = {
        'ADMIN':       ['admin', 'dashboard', 'quiz', 'media', 'teacher'],
        'INSTRUCTOR':  ['dashboard', 'quiz', 'media', 'teacher'],
        'MONITOR':     ['dashboard', 'quiz', 'media'],
        'APRENDIZ':    ['dashboard', 'quiz'],
    }
    return permissions.get(role, ['dashboard'])


# ─── Test ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def test_api(request):
    return Response({"message": "Backend funcionando correctamente"})


# ─── Registro ────────────────────────────────────────────────────────────────

@api_view(['POST'])
def register(request):
    """
    Crea Person + User en una sola transacción atómica.
    El rol por defecto es APRENDIZ.
    Body: email, password, doc_type, doc_num, first_name, last_name, phone_num (opcional)
    """
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():        # si algo falla, revierte ambas tablas
            user = serializer.save()      # crea Person + User (ver serializers.py)

        tokens      = get_tokens_for_user(user)
        user_data   = build_user_payload(user)

        return Response({
            'access':  tokens['access'],
            'refresh': tokens['refresh'],
            'user':    user_data,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': f'Error al crear el usuario: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── Login ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
def login(request):
    """
    Login con email + password.
    Body: email, password
    """
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email    = serializer.validated_data['email']
    password = serializer.validated_data['password']

    # Buscar Person por email
    try:
        person = Person.objects.get(email=email)
    except Person.DoesNotExist:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Verificar contraseña
    if not check_password(password, person.password):
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Verificar que tenga User asociado
    try:
        user = User.objects.get(person=person)
    except User.DoesNotExist:
        return Response(
            {'error': 'Usuario sin rol asignado, contacta al administrador'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Verificar estado
    if person.status == 'INACTIVO':
        return Response(
            {'error': 'Cuenta inactiva'},
            status=status.HTTP_403_FORBIDDEN
        )

    tokens    = get_tokens_for_user(user)
    user_data = build_user_payload(user)

    return Response({
        'access':  tokens['access'],
        'refresh': tokens['refresh'],
        'user':    user_data,
    }, status=status.HTTP_200_OK)


# ─── Me (datos del usuario autenticado) ──────────────────────────────────────

@api_view(['GET'])
def me(request):
    """
    Retorna los datos del usuario autenticado a partir del token JWT.
    El frontend llama a este endpoint al refrescar la página.
    """
    # Leer user_id del payload del token
    user_id = request.auth.payload.get('user_id') if request.auth else None

    if not user_id:
        return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = User.objects.select_related('person').get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    return Response(build_user_payload(user), status=status.HTTP_200_OK)


# ─── Resultados de pruebas ────────────────────────────────────────────────────

@api_view(['GET'])
def get_test_results(request, user_id):
    """Retorna los resultados de pruebas de un usuario"""
    try:
        user    = User.objects.get(user_id=user_id)
        results = TestResult.objects.filter(user=user).order_by('-created_at')
        serializer = TestResultSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def save_test_result(request):
    """Guarda el resultado de una prueba"""
    user_id = request.data.get('user_id')

    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    result = TestResult.objects.create(
        user            = user,
        score           = request.data.get('score'),
        level           = request.data.get('level'),
        correct_answers = request.data.get('correct_answers'),
        total_questions = request.data.get('total_questions'),
        feedback        = request.data.get('feedback', ''),
        duration        = request.data.get('duration', ''),
    )

    serializer = TestResultSerializer(result)
    return Response(serializer.data, status=status.HTTP_201_CREATED)