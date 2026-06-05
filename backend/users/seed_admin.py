from django.contrib.auth.hashers import make_password
from users.Models.modelsSENA import Person, User, RoleAccess

def run():
    person, _ = Person.objects.get_or_create(
        email='admin@test.com',
        defaults={
            'password':   make_password('admin123'),
            'doc_type':   'CC',
            'doc_num':    '123456789',
            'first_name': 'Admin',
            'last_name':  'Test',
            'phone_num':  3001234567,
            'status':     'ACTIVO',
        }
    )

    role = RoleAccess.objects.filter(role_id='ADMIN').first()
    if not role:
        print('❌ El rol ADMIN no existe en roles_access')
        return

    user, created = User.objects.get_or_create(
        person=person,
        defaults={
            'role':   role,
            'status': 'EN_FORMACION',
            'mfa':    '',
        }
    )

    if created:
        print('✅ Admin creado exitosamente')
    else:
        print('⚠️  El admin ya existía')


run()