# 💬 Chat Application - README

## 🎯 Project Overview
A centralized chat application built with Django (server-side) and JavaScript (client-side) featuring multiple chat rooms, user authentication, and moderation capabilities.

## 🛠️ Technologies
- **Backend**: Django 🐍
- **Frontend**: JavaScript, jQuery, Bootstrap 💻
- **Language**: Python 3.x

## ✨ Features
- 👤 User registration and authentication
- 🏠 Multiple chat rooms
- ➕ Create and manage chat rooms
- 💬 Real-time message display with dynamic page refresh
- 😊 Emoji support
- 🔐 User permissions management
- 🛡️ Moderation tools

## 📦 Installation

### Prerequisites
- Python 3.x 🐍
- pip 📥

### 🚀 Setup
1. **Clone the repository**
```bash
git clone <repository-url>
cd <project-folder>
```

2. **Create a virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Apply migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create a superuser** (optional) 👑
```bash
python manage.py createsuperuser
```

6. **Run the development server**
```bash
python manage.py runserver
```

7. **Access the application** at `http://localhost:8000` 🌐

## 🎮 Usage
1. 📝 Register a new account or login
2. 🔍 Browse available chat rooms or create a new one
3. 🚪 Join a room to start chatting
4. 😄 Use emojis to enhance your messages
5. 🛡️ Moderators can manage room content and users

## 📁 Project Structure
```
project/
├── 💬 chat/               # Main chat application
├── 🎨 static/            # CSS, JavaScript files
├── 📄 templates/         # HTML templates
├── ⚙️ manage.py
└── 📋 requirements.txt
```

## 👥 Team
This project was developed as a team assignment for the Web Programming course.

