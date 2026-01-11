# ⚡ Pokémon Battle Arena (Multiplayer Realtime)

> Un clon competitivo de Pokémon en tiempo real, construido con la potencia de Angular 18, Supabase y TailwindCSS.

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

---

## 🎮 Demo en Vivo
¡No necesitas instalar nada para probarlo! Juega ahora mismo aquí:
👉 **[Jugar Pokémon Battle Arena](https://pokemon-final-leonardo.vercel.app)**

---

## 🚀 Los 4 Pilares del Proyecto
Este proyecto fue construido siguiendo una arquitectura de 4 pilares fundamentales explicados en mi canal de YouTube:

### 1. 🧠 El Cerebro (Data & API)
Conexión directa a la **PokéAPI** con un algoritmo personalizado que desbloquea el acceso a los **1,025 Pokémones** existentes, trayendo sus sprites, estadísticas base y tipos elementales en tiempo real.

### 2. 👻 El Alma (Multiplayer - Backend)
Uso de **Supabase Realtime** para gestionar el estado de la batalla.
- Sincronización vía **WebSockets** (latencia < 50ms).
- Sistema de Salas únicas con códigos de 4 dígitos.
- Bloqueo de turnos para evitar condiciones de carrera.

### 3. ❤️ El Corazón (Lógica de Juego)
Motor de batalla programado en TypeScript:
- Cálculo de daño basado en Ataque vs Defensa.
- **Mecánica Comeback:** Barra de "Ultimate" que se carga al recibir daño.
- Animaciones CSS para ataques y efectos de daño.

### 4. 🦴 El Cuerpo (Frontend & UI)
Interfaz moderna diseñada con **Tailwind CSS**.
- Diseño "Glassmorphism" (Efecto cristal).
- Totalmente Responsivo (Funciona en Celular y PC).
- Feedback visual y sonoro (Narrador de batalla).

---

## 🛠️ Instalación Local (Para Desarrolladores)

Si quieres clonar este repositorio y correrlo en tu máquina, sigue estos pasos:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/gaelking3231/pokemon-battle-arena-angular.git](https://github.com/gaelking3231/pokemon-battle-arena-angular.git)
cd pokemon-battle-arena-angular

2. Instalar dependencias
Bash

npm install

3. Configurar Variables de Entorno (IMPORTANTE 🛡️)

Por seguridad, las claves de conexión a la base de datos no están incluidas en el repositorio. Debes crear tu propio archivo:

    Ve a la carpeta src/environments/.

    Crea un archivo llamado environment.ts.

    Copia el siguiente código y pega TUS credenciales de Supabase:

TypeScript

export const environment = {
  production: false,
  supabaseUrl: 'TU_URL_DE_SUPABASE_AQUI',
  supabaseKey: 'TU_ANON_KEY_DE_SUPABASE_AQUI'
};

4. Configurar Base de Datos

En tu proyecto de Supabase, crea una tabla llamada battles con las siguientes columnas mínimas (o revisa el código en supabase.service.ts para ver la estructura):

    id (int8)

    code (text)

    player1_team (json)

    player2_team (json)

    current_turn (text)

5. Correr el servidor
Bash

ng serve

Abre tu navegador en http://localhost:4200/.
📂 Estructura del Proyecto

src/
├── app/
│   ├── core/services/      # Lógica de negocio (API y Supabase)
│   │   ├── pokemon.service.ts
│   │   └── supabase.service.ts
│   ├── app.component.ts    # Lógica de la batalla
│   └── ...
├── environments/           # Variables de entorno (Ignoradas por Git)
└── assets/                 # Imágenes y sonidos

👨‍💻 Autor

Gael King

    🎓 Ingeniería Informática

    🎥 Video Explicativo en YouTube

    🐙 GitHub Profile

Hecho con ❤️ para aprobar la materia (y dominar el mundo).
