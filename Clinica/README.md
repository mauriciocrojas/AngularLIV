# Clínica Online - Funcionalidades por Rol

Este sistema permite gestionar turnos, usuarios e historias clínicas diferenciando las funcionalidades según el tipo de usuario: **Paciente**, **Especialista** o **Administrador**.

---

## 🧑‍⚕️ Pacientes

### 🗓️ Mis Turnos
- Ver todos sus turnos, sin importar el estado.
- Cancelar turnos que aún no fueron aceptados.
- Ver la reseña del turno.
- Calificar la atención recibida.
- Completar una encuesta con comentarios.
- Buscar mediante un filtro por palabras clave, sobre turnos e historias clínicas

### ➕ Solicitar Turno
- Solicitar turnos seleccionando:
  - Especialidad
  - Profesional
  - Horario disponible

### 👤 Mi Perfil
- Visualizar sus datos personales.
- Consultar todas sus historias clínicas.

---

## 🩺 Especialistas

### 🗓️ Mis Turnos
- Ver turnos asignados.
- Aceptar o finalizar turnos.
- Cargar una historia clínica al finalizar un turno.
- Buscar mediante un filtro por palabras clave, sobre turnos e historias clínicas

### 👤 Mi Perfil
- Ver datos personales.
- Agregar nuevas disponibilidades horarias.
- Consultar disponibilidades ya cargadas.

### 🧑‍🤝‍🧑 Pacientes
- Ver los pacientes que han sido atendidos.
- Acceder a las historias clínicas de esos pacientes.

---

## 👨‍💼 Administradores

### 👥 Usuarios
- Ver todos los usuarios registrados.
- Habilitar o inhabilitar especialistas.
- Ver historias clínicas de los pacientes.
- Exportar el listado de usuarios a Excel.
- Crear nuevos usuarios: paciente, especialista o administrador.

### 🗓️ Administrar Turnos
- Ver todos los turnos, sea cual sea su estado.
- Cancelar turnos.
- Ver reseñas asociadas.
- Buscar mediante un filtro por palabras clave, sobre turnos e historias clínicas

### ➕ Solicitar Turno
- Solicitar turnos en nombre de un paciente.

---

> Proyecto desarrollado con Angular y Supabase.  
> Estilo visual: clínico.