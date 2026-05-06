"""Авторизация пользователей: вход, выход, проверка сессии."""
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p68201465_shipment_tracking_se')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # POST /login
        if method == 'POST' and '/login' in path:
            body = json.loads(event.get('body') or '{}')
            username = body.get('username', '').strip().lower()
            password = body.get('password', '')

            if not username or not password:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

            pw_hash = hash_password(password)
            cur.execute('SELECT id, full_name, role, phone FROM users WHERE username = %s AND password_hash = %s', (username, pw_hash))
            row = cur.fetchone()

            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            user_id, full_name, role, phone = row
            new_token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)

            cur.execute('INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)', (user_id, new_token, expires))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps({
                    'token': new_token,
                    'user': {'id': user_id, 'username': username, 'full_name': full_name, 'role': role, 'phone': phone}
                })
            }

        # POST /logout
        if method == 'POST' and '/logout' in path:
            if token:
                cur.execute('UPDATE sessions SET expires_at = NOW() WHERE token = %s', (token,))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # GET /me
        if method == 'GET' and '/me' in path:
            if not token:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

            cur.execute('''
                SELECT u.id, u.username, u.full_name, u.role, u.phone, u.created_at
                FROM sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()
            ''', (token,))
            row = cur.fetchone()

            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

            uid, uname, full_name, role, phone, created_at = row
            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps({
                    'user': {
                        'id': uid,
                        'username': uname,
                        'full_name': full_name,
                        'role': role,
                        'phone': phone or '',
                        'created_at': created_at.isoformat() if created_at else ''
                    }
                })
            }

        # PUT /profile
        if method == 'PUT' and '/profile' in path:
            if not token:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

            cur.execute('SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()', (token,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

            user_id = row[0]
            body = json.loads(event.get('body') or '{}')
            full_name = body.get('full_name', '').strip()
            phone = body.get('phone', '').strip()
            new_password = body.get('password', '').strip()

            if full_name:
                cur.execute('UPDATE users SET full_name = %s WHERE id = %s', (full_name, user_id))
            if phone:
                cur.execute('UPDATE users SET phone = %s WHERE id = %s', (phone, user_id))
            if new_password:
                pw_hash = hash_password(new_password)
                cur.execute('UPDATE users SET password_hash = %s WHERE id = %s', (pw_hash, user_id))

            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
