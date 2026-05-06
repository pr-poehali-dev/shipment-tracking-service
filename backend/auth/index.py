"""Авторизация: login, logout, me, profile. action передаётся в теле запроса."""
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p68201465_shipment_tracking_se')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data)}


def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg})}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    try:
        conn = get_conn()
    except Exception as e:
        return err(f'DB error: {e}', 500)

    cur = conn.cursor()
    try:
        # LOGIN
        if action == 'login':
            username = body.get('username', '').strip().lower()
            password = body.get('password', '')
            if not username or not password:
                return err('Введите логин и пароль')
            pw_hash = hash_password(password)
            cur.execute(
                'SELECT id, full_name, role, phone FROM users WHERE username = %s AND password_hash = %s',
                (username, pw_hash)
            )
            row = cur.fetchone()
            if not row:
                return err('Неверный логин или пароль', 401)
            user_id, full_name, role, phone = row
            new_token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute(
                'INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)',
                (user_id, new_token, expires)
            )
            conn.commit()
            return ok({'token': new_token, 'user': {
                'id': user_id, 'username': username,
                'full_name': full_name, 'role': role, 'phone': phone or ''
            }})

        # LOGOUT
        if action == 'logout':
            if token:
                cur.execute('UPDATE sessions SET expires_at = NOW() WHERE token = %s', (token,))
                conn.commit()
            return ok({'ok': True})

        # ME
        if action == 'me':
            if not token:
                return err('Не авторизован', 401)
            cur.execute('''
                SELECT u.id, u.username, u.full_name, u.role, u.phone, u.created_at
                FROM sessions s JOIN users u ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()
            ''', (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            uid, uname, full_name, role, phone, created_at = row
            return ok({'user': {
                'id': uid, 'username': uname, 'full_name': full_name,
                'role': role, 'phone': phone or '',
                'created_at': created_at.isoformat() if created_at else ''
            }})

        # UPDATE PROFILE
        if action == 'update_profile':
            if not token:
                return err('Не авторизован', 401)
            cur.execute('SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()', (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            user_id = row[0]
            full_name = body.get('full_name', '').strip()
            phone = body.get('phone', '').strip()
            new_password = body.get('password', '').strip()
            if full_name:
                cur.execute('UPDATE users SET full_name = %s WHERE id = %s', (full_name, user_id))
            if phone:
                cur.execute('UPDATE users SET phone = %s WHERE id = %s', (phone, user_id))
            if new_password:
                cur.execute('UPDATE users SET password_hash = %s WHERE id = %s', (hash_password(new_password), user_id))
            conn.commit()
            return ok({'ok': True})

        return err('Unknown action')

    finally:
        cur.close()
        conn.close()
