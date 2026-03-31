# My Web App

Full-stack web application with React frontend and Django backend using MySQL.

## Structure
```
my-web-app/
├── frontend/           # React app
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/            # Django app
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── requirements.txt
│   └── db.sqlite3 (dev) or MySQL config
├── docker-compose.yml  # Optional: MySQL + services
└── README.md
```

## Setup
1. Backend: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python manage.py migrate`
2. Frontend: `cd frontend && npm install && npm start`
3. MySQL: Configure in backend/settings.py or use docker-compose.

