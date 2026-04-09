"""Регистрация, вход и проверка сессии пользователя мессенджера"""
import json
import os
import hashlib
import secrets
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if path.endswith('/register') and method == 'POST':
            name = body.get('name', '').strip()
            password = body.get('password', '')
            if not name or len(password) < 4:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Имя и пароль обязательны (мин. 4 символа)'})}

            cur.execute("SELECT nextval('user_number_seq')")
            user_number = cur.fetchone()[0]
            password_hash = hash_password(password)
            session_token = secrets.token_hex(32)

            cur.execute(
                "INSERT INTO users (user_number, name, password_hash, session_token) VALUES (%s, %s, %s, %s) RETURNING id",
                (user_number, name, password_hash, session_token)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'user_id': user_id, 'user_number': user_number, 'name': name, 'session_token': session_token
            })}

        elif path.endswith('/login') and method == 'POST':
            user_number = body.get('user_number')
            password = body.get('password', '')
            cur.execute("SELECT id, name, password_hash FROM users WHERE user_number = %s", (user_number,))
            row = cur.fetchone()
            if not row or row[2] != hash_password(password):
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный номер или пароль'})}

            session_token = secrets.token_hex(32)
            cur.execute("UPDATE users SET session_token = %s WHERE id = %s", (session_token, row[0]))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'user_id': row[0], 'user_number': user_number, 'name': row[1], 'session_token': session_token
            })}

        elif path.endswith('/me') and method == 'GET':
            token = event.get('headers', {}).get('x-session-token') or event.get('headers', {}).get('X-Session-Token')
            if not token:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Нет токена'})}
            cur.execute("SELECT id, user_number, name FROM users WHERE session_token = %s", (token,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Сессия недействительна'})}
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'user_id': row[0], 'user_number': row[1], 'name': row[2]})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
    finally:
        cur.close()
        conn.close()
