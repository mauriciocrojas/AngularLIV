# Clínica Online - Funcionalidades por Rol

Este sistema permite gestionar turnos, usuarios e historias clínicas diferenciando las funcionalidades según el tipo de usuario: **Paciente**, **Especialista** o **Administrador**.

---

## 🧑‍⚕️ Pacientes

### 🗓️ Mis Turnos
![image](https://github.com/user-attachments/assets/4b3d4452-28fd-4ee8-938c-22b1aaa612fb)

- Ver todos sus turnos, sin importar el estado.
- Cancelar turnos que aún no fueron aceptados.
- Ver la reseña del turno.
- Calificar la atención recibida.
- Completar una encuesta con comentarios.
- Buscar mediante un filtro por palabras clave, sobre turnos e historias clínicas.


### ➕ Solicitar Turno
![image](https://github.com/user-attachments/assets/afa09e2f-a9d0-4db8-8d01-1321930e9649)

- Solicitar turnos seleccionando:
  - Especialidad
  - Profesional
  - Horario disponible


### 👤 Mi Perfil
![image](https://github.com/user-attachments/assets/11a7e73b-d85b-46da-aaf5-850dc8473dcd)

- Visualizar sus datos personales.
- Consultar todas sus historias clínicas.
- Descargar un PDF con mis historias clínicas filtrando por especialista


---

## 🩺 Especialistas

### 🗓️ Mis Turnos
![image](https://github.com/user-attachments/assets/510c1fe3-e0a9-4570-b997-7a08f767efac)

- Ver turnos asignados.
- Aceptar o finalizar turnos.
- Cargar una historia clínica al finalizar un turno.
- Buscar mediante un filtro por palabras clave, sobre turnos e historias clínicas.


### 👤 Mi Perfil
![image](https://github.com/user-attachments/assets/71f09d63-1a82-440e-aa82-8f6b64eda679)

- Ver datos personales.
- Agregar nuevas disponibilidades horarias.
- Consultar disponibilidades ya cargadas.


### 🧑‍🤝‍🧑 Pacientes
![image](https://github.com/user-attachments/assets/a8430fb3-3051-4376-a92c-1aeb24484a55)

- Ver los pacientes que han sido atendidos.
- Acceder a las historias clínicas de esos pacientes.


---

## 👨‍💼 Administradores

### 👥 Usuarios
![image](https://github.com/user-attachments/assets/e568186e-ed95-4c52-8447-071f38abcc42)

- Ver todos los usuarios registrados.
- Habilitar o inhabilitar especialistas.
- Ver historias clínicas de los pacientes.
- Exportar el listado de usuarios a Excel.
- Crear nuevos usuarios: paciente, especialista o administrador.


### 🗓️ Administrar Turnos
![image](https://github.com/user-attachments/assets/add1da5a-1495-4ab5-bc75-21f38dbab4bc)

- Ver todos los turnos, sea cual sea su estado.
- Cancelar turnos.
- Ver reseñas asociadas.
- Buscar mediante un filtro por palabras clave, sobre turnos e historias clínicas.


### ➕ Solicitar Turno
![image](https://github.com/user-attachments/assets/086dfdb7-d4e3-4a55-a29f-455b91a51b19)

- Solicitar turnos en nombre de un paciente.


### ➕ Informes (gráficos y estadísticas)
![image](https://github.com/user-attachments/assets/0a6a716f-75ba-4637-898b-45b9e1c2ecfa)

- Podrá visualizar los logs de ingresos.
- La cantidad de turnos por especialidad.
- La cantidad de turnos por día.
- La cantidade de turnos por médico según rango de fenchas.
- La posibilidad de bajar todos estos datos en formato PDF.

---

> Proyecto desarrollado con Angular y Supabase.  
> Estilo visual: clínico.
