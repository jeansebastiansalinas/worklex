from django.db import models
from django.utils import timezone


# ─── Person ───────────────────────────────────────────────────────────────────

class Person(models.Model):
    person_id = models.AutoField(primary_key=True)
    email     = models.EmailField(unique=True)
    password  = models.CharField(max_length=255)

    DOC_TYPES = [
        ('CC', 'Cédula'),
        ('CE', 'Cédula Extranjería'),
        ('TI', 'Tarjeta Identidad'),
        ('PS', 'Pasaporte'),
        ('OT', 'Otro'),
    ]
    doc_type = models.CharField(max_length=5, choices=DOC_TYPES)
    doc_num  = models.CharField(max_length=50, unique=True)

    first_name = models.CharField(max_length=50)
    last_name  = models.CharField(max_length=50)
    phone_num  = models.BigIntegerField(null=True, blank=True)

    PERSTATUS_CHOICES = [
        ('ACTIVO',   'Activo'),
        ('INACTIVO', 'Inactivo'),
    ]
    status     = models.CharField(max_length=50, choices=PERSTATUS_CHOICES)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        db_table = '"worklex"."persons"'


# ─── RoleAccess ───────────────────────────────────────────────────────────────
# Va ANTES de User para que User pueda referenciarla

class RoleAccess(models.Model):
    ROLE_CHOICES = [
        ('ADMIN',      'Admin'),
        ('APRENDIZ',   'Aprendiz'),
        ('MONITOR',    'Monitor'),
        ('INSTRUCTOR', 'Instructor'),
    ]
    # ✅ Sin unique=True — un rol puede tener múltiples links
    role_id = models.CharField(max_length=50, choices=ROLE_CHOICES)
    link_id = models.CharField(max_length=100)
    status  = models.CharField(max_length=20, default='ACTIVO')

    class Meta:
        db_table        = '"worklex"."roles_access"'
        unique_together = ('role_id', 'link_id')

    def __str__(self):
        return f"{self.role_id} → {self.link_id}"


# ─── User ─────────────────────────────────────────────────────────────────────

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    person  = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name='users',
    )

    # ✅ FK por id (no por role_id) porque role_id ya no es unique
    role = models.ForeignKey(
        RoleAccess,
        db_column='role_id',
        on_delete=models.PROTECT,
        related_name='users',
        null=True,
        blank=True,
    )

    STATUS_CHOICES = [
        ('PENDIENTE',    'Pendiente Activar Cuenta'),
        ('EN_FORMACION', 'En formación'),
        ('CANCELADO',    'Cancelado'),
        ('TRASLADADO',   'Trasladado'),
        ('RETIRO',       'Retiro voluntario'),
        ('APLAZADO',     'Aplazado'),
    ]
    status     = models.CharField(max_length=50, choices=STATUS_CHOICES)
    mfa        = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    @property
    def is_authenticated(self):
        """Siempre retorna True para usuarios validos."""
        return True

    @property
    def is_anonymous(self):
        """Siempre retorna False para usuarios validos."""
        return False

    class Meta:
        db_table = '"worklex"."users"'

    def __str__(self):
        return f"{self.person.first_name} ({self.role})"


# ─── Subject ──────────────────────────────────────────────────────────────────

class Subject(models.Model):
    subject_id  = models.CharField(max_length=50, primary_key=True)
    description = models.CharField(max_length=255)

    class Meta:
        db_table = '"worklex"."subjects"'

    def __str__(self):
        return self.description


# ─── DigitalDictionary ────────────────────────────────────────────────────────

class DigitalDictionary(models.Model):
    word_id    = models.CharField(max_length=50)
    subject    = models.ForeignKey(Subject, on_delete=models.CASCADE)
    definition = models.CharField(max_length=255)
    synonyms   = models.CharField(max_length=255)
    audio      = models.CharField(max_length=255)
    video      = models.CharField(max_length=255, null=True, blank=True)
    image      = models.CharField(max_length=255)

    class Meta:
        db_table        = '"worklex"."digital_dictionaries"'
        unique_together = ('word_id', 'subject')


# ─── Ranking ──────────────────────────────────────────────────────────────────

class Ranking(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    word_id = models.CharField(max_length=50)
    level   = models.CharField(max_length=50)
    value   = models.CharField(max_length=50)

    class Meta:
        db_table        = '"worklex"."ranking"'
        unique_together = ('subject', 'word_id')


# ─── Post ─────────────────────────────────────────────────────────────────────

class Post(models.Model):
    post_id = models.AutoField(primary_key=True)
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title   = models.CharField(max_length=255, null=True, blank=True)
    body    = models.TextField(null=True, blank=True)
    status  = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"worklex"."posts"'


# ─── UserLog ──────────────────────────────────────────────────────────────────

class UserLog(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='logs')
    transaction = models.CharField(max_length=255)
    created_at  = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = '"worklex"."users_logs"'


# ─── TestResult ───────────────────────────────────────────────────────────────

class TestResult(models.Model):
    user  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_results')
    score = models.IntegerField()

    LEVEL_CHOICES = [
        ('A1', 'A1 - Principiante'),
        ('A2', 'A2 - Elemental'),
        ('B1', 'B1 - Intermedio'),
        ('B2', 'B2 - Intermedio Alto'),
        ('C1', 'C1 - Avanzado'),
        ('C2', 'C2 - Maestria'),
    ]
    level           = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    correct_answers = models.IntegerField()
    total_questions = models.IntegerField()
    feedback        = models.TextField(null=True, blank=True)
    duration        = models.CharField(max_length=20, null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"worklex"."testresults"'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.person.first_name} - {self.level} ({self.score}%)"