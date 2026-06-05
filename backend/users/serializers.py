from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .Models.modelsSENA import Person, User, Subject, DigitalDictionary, TestResult, RoleAccess


# ─── Person ──────────────────────────────────────────────────────────────────

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = [
            'person_id', 'email', 'doc_type', 'doc_num',
            'first_name', 'last_name', 'phone_num', 'status', 'created_at'
        ]
        extra_kwargs = {
            'person_id':  {'read_only': True},
            'created_at': {'read_only': True},
        }


# ─── User ─────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    person    = PersonSerializer(read_only=True)
    role_name = serializers.CharField(source='role.role_id', read_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'person', 'role', 'role_name', 'status', 'created_at']
        extra_kwargs = {
            'user_id':    {'read_only': True},
            'created_at': {'read_only': True},
        }


# ─── Registro ────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    """
    Crea Person + User en una sola operación.
    El rol siempre es APRENDIZ al registrarse desde la página.
    """
    email      = serializers.EmailField()
    password   = serializers.CharField(write_only=True, min_length=6)
    doc_type   = serializers.ChoiceField(choices=Person.DOC_TYPES)
    doc_num    = serializers.CharField(max_length=50)
    first_name = serializers.CharField(max_length=50)
    last_name  = serializers.CharField(max_length=50)
    phone_num  = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        if Person.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado")
        return value

    def validate_doc_num(self, value):
        if Person.objects.filter(doc_num=value).exists():
            raise serializers.ValidationError("Este documento ya está registrado")
        return value

    def create(self, validated_data):
        # 1. Crear Person
        person = Person.objects.create(
            email      = validated_data['email'],
            password   = make_password(validated_data['password']),
            doc_type   = validated_data['doc_type'],
            doc_num    = validated_data['doc_num'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            phone_num  = validated_data.get('phone_num'),
            status     = 'ACTIVO',
        )

        # 2. Obtener el rol APRENDIZ desde roles_access
        role = RoleAccess.objects.filter(role_id='APRENDIZ').first()
        if not role:
            raise serializers.ValidationError(
                "El rol APRENDIZ no existe en la base de datos. "
                "Contacta al administrador."
            )

        # 3. Crear User con rol APRENDIZ
        user = User.objects.create(
            person = person,
            role   = role,        # ← objeto RoleAccess, no string
            status = 'EN_FORMACION',
            mfa    = '',
        )

        return user


# ─── Login ───────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ─── TestResult ──────────────────────────────────────────────────────────────

class TestResultSerializer(serializers.ModelSerializer):
    user_name  = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    correctAnswers = serializers.IntegerField(source='correct_answers', read_only=True)
    totalQuestions = serializers.IntegerField(source='total_questions', read_only=True)
    completedAt    = serializers.DateTimeField(source='created_at',     read_only=True)

    class Meta:
        model = TestResult
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'score', 'level', 'feedback', 'duration',
            'correctAnswers', 'totalQuestions', 'completedAt',
        ]
        extra_kwargs = {
            'id':         {'read_only': True},
            'created_at': {'read_only': True},
        }

    def get_user_name(self, obj):
        return f"{obj.user.person.first_name} {obj.user.person.last_name}"

    def get_user_email(self, obj):
        return obj.user.person.email


# ─── Subject / Dictionary ────────────────────────────────────────────────────

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subject
        fields = ['subject_id', 'description']


class DigitalDictionarySerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.description', read_only=True)

    class Meta:
        model  = DigitalDictionary
        fields = [
            'word_id', 'subject', 'subject_name', 'definition',
            'synonyms', 'audio', 'video', 'image'
        ]