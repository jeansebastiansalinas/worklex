# WorkLex Frontend

Aplicación frontend desarrollada con React, Vite y TypeScript para la plataforma WorkLex.

## Requisitos Previos

Antes de iniciar el proyecto, asegúrate de tener instalado:

* Git
* Docker
* Docker Compose

Verificar instalaciones:

```bash
git --version
docker --version
docker-compose --version
```

---

## Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd worklex
```

---

## Crear la Red Docker

Verificar si la red ya existe:

```bash
docker network ls
```

Si no existe, crearla:

```bash
docker network create worklex_network
```

Verificar la red:

```bash
docker network inspect worklex_network
```

---

## Levantar la Base de Datos

Ejecutar el siguiente comando para iniciar PostgreSQL:

```bash
docker-compose -f docker-compose.db.yml -p worklex_aplicacion up -d
```

Verificar que el contenedor esté ejecutándose:

```bash
docker ps
```

---

## Verificar la Creación del Esquema

Una vez la base de datos esté activa, validar que el esquema fue creado correctamente:

```bash
docker exec -it worklex_persistencia psql -U admin -d sena -c "\dn"
```

---

## Levantar Backend y Frontend

Después de iniciar la base de datos:

```bash
docker-compose -f docker-compose.yml -p worklex_aplicacion up --build
```

---

## Verificar los Contenedores

```bash
docker ps
```

Deberías visualizar los contenedores de:

* Frontend
* Backend
* PostgreSQL

---

## Acceso a los Servicios

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:8000
```

### PostgreSQL

```text
Host: localhost
Puerto: 5432
Base de datos: sena
Usuario: admin
```

---

## Detener los Servicios

Detener Backend y Frontend:

```bash
docker-compose -f docker-compose.yml -p worklex_aplicacion down
```

Detener Base de Datos:

```bash
docker-compose -f docker-compose.db.yml -p worklex_aplicacion down
```

---

## Eliminar Contenedores Detenidos

```bash
docker container prune -f
```

---

## Eliminar Imágenes No Utilizadas

```bash
docker image prune -a -f
```

---

## Tecnologías Utilizadas

* React
* Vite
* TypeScript
* Docker
* PostgreSQL
* Django REST Framework
* JWT Authentication

---

## Estructura General del Proyecto

```text
worklex/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── apps/
│   ├── manage.py
│   └── requirements.txt
│
├── docker-compose.yml
├── docker-compose.db.yml
└── README.md
```

---

## Flujo de Inicio del Proyecto

1. Clonar el repositorio.
2. Crear la red Docker.
3. Levantar la base de datos.
4. Verificar la creación del esquema.
5. Levantar backend y frontend.
6. Acceder al sistema desde el navegador.

---

## Equipo de Desarrollo

Proyecto desarrollado para la gestión y evaluación de competencias en inglés mediante una arquitectura desacoplada basada en React y Django REST Framework.
