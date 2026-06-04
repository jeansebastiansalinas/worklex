from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action

from ..Controllers.ControllerSENA import (
    AuthController,
    PersonController,
    UserController,
    SubjectController,
    DictionaryController,
    TestResultController,
    _build_user_response,
)
from ..serializers import (
    LoginSerializer,
    RegisterSerializer,
    PersonSerializer,
    DigitalDictionarySerializer,
    TestResultSerializer,
)


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data, error = AuthController.login(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
        )
        if error:
            return Response({'error': error}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(data)


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data, error = AuthController.register(serializer.validated_data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(data, status=status.HTTP_201_CREATED)


class MeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(AuthController.get_me(request.user))


class PersonViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response(PersonController.list_all())

    def retrieve(self, request, pk=None):
        person, error = PersonController.get_by_id(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(PersonSerializer(person).data)

    def create(self, request):
        person, error = PersonController.create(request.data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PersonSerializer(person).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        person, error = PersonController.update(pk, request.data)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(PersonSerializer(person).data)

    def destroy(self, request, pk=None):
        ok, error = PersonController.delete(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response(UserController.list_all(role_filter=request.query_params.get('role')))

    def retrieve(self, request, pk=None):
        user, error = UserController.get_by_id(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(_build_user_response(user, user.person))

    @action(detail=True, methods=['patch'])
    def toggle_status(self, request, pk=None):
        new_status, error = UserController.toggle_status(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response({'status': new_status})

    @action(detail=True, methods=['patch'])
    def change_role(self, request, pk=None):
        new_role = request.data.get('role')
        if not new_role:
            return Response({'error': 'Role not provided'}, status=status.HTTP_400_BAD_REQUEST)
        role, error = UserController.change_role(pk, new_role)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response({'role': role})


class SubjectViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response(SubjectController.list_all())

    def retrieve(self, request, pk=None):
        subject, error = SubjectController.get_by_id(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response({'id': subject.subject_id, 'description': subject.description})

    def create(self, request):
        data, error = SubjectController.create(request.data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        ok, error = SubjectController.delete(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DigitalDictionaryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response(DictionaryController.list_all(subject_id=request.query_params.get('subject')))

    def retrieve(self, request, pk=None):
        doc, error = DictionaryController.get_by_id(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(DigitalDictionarySerializer(doc).data)

    def create(self, request):
        doc, error = DictionaryController.create(request.data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DigitalDictionarySerializer(doc).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        ok, error = DictionaryController.delete(pk)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TestResultViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response(TestResultController.list_all(user_id=request.query_params.get('user_id')))

    def create(self, request):
        result, error = TestResultController.create(request.data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TestResultSerializer(result).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def add_feedback(self, request, pk=None):
        feedback = request.data.get('feedback')
        if not feedback:
            return Response({'error': 'Feedback not provided'}, status=status.HTTP_400_BAD_REQUEST)
        result, error = TestResultController.add_feedback(pk, feedback)
        if error:
            return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)
        return Response({'feedback': result.feedback})
    
import random
from ..Models.modelsSENA import DigitalDictionary

DISTRACTORS_POOL = ['gear', 'valve', 'pipe', 'bolt', 'wrench', 'lever', 'pump', 'cable', 'hose', 'filter', 'bearing', 'shaft']

class QuizAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        subject_id = request.query_params.get('subject', 'mecanica')
        limit = int(request.query_params.get('limit', 10))

        words = list(DigitalDictionary.objects.filter(subject_id=subject_id))

        if len(words) < 1:
            return Response({'error': 'No hay palabras disponibles'}, status=status.HTTP_400_BAD_REQUEST)

        selected = random.sample(words, min(limit, len(words)))
        real_words = [w.word_id for w in words]

        questions = []
        for i, word in enumerate(selected):
            # Distractores: otras palabras reales + pool externo, sin repetir la correcta
            real_distractors = [w for w in real_words if w != word.word_id]
            extra = [w for w in DISTRACTORS_POOL if w not in real_words and w != word.word_id]
            
            all_distractors = real_distractors + extra
            # Tomar exactamente 3, rellenando si hace falta
            distractors = all_distractors[:3]

            options = distractors + [word.word_id]
            random.shuffle(options)

            questions.append({
                'id': i + 1,
                'word_id': word.word_id,
                'image': request.build_absolute_uri(f'/media/images/{word.image}'),
                'audio': request.build_absolute_uri(f'/media/audio/{word.audio}'),
                'definition': word.definition,
                'options': options,
                'correctAnswer': options.index(word.word_id),
                'category': subject_id,
                'difficulty': 'Easy',
            })

        return Response(questions)