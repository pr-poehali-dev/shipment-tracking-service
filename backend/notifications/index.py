"""Управление уведомлениями пользователя."""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p68201465_shipment_tracking_se')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')


def get_user_id(cur, token: str):
    cur.execute('SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()', (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    if not token:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_id = get_user_id(cur, token)
        if not user_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

        # GET / — список уведомлений
        if method == 'GET':
            cur.execute('''
                SELECT id, text, type, read, created_at
                FROM notifications
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            ''', (user_id,))
            rows = cur.fetchall()
            notifs = []
            for r in rows:
                notifs.append({
                    'id': r[0],
                    'text': r[1],
                    'type': r[2],
                    'read': r[3],
                    'created_at': r[4].isoformat() if r[4] else ''
                })
            cur.execute('SELECT COUNT(*) FROM notifications WHERE user_id = %s AND read = false', (user_id,))
            unread = cur.fetchone()[0]
            return {
                'statusCode': 200, 'headers': CORS,
                'body': json.dumps({'notifications': notifs, 'unread_count': unread})
            }

        # PUT /read-all — пометить все прочитанными
        if method == 'PUT' and '/read-all' in path:
            cur.execute('UPDATE notifications SET read = true WHERE user_id = %s', (user_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # PUT /<id>/read — пометить одно прочитанным
        if method == 'PUT':
            parts = path.rstrip('/').split('/')
            notif_id = None
            for part in parts:
                if part.isdigit():
                    notif_id = int(part)
                    break
            if notif_id:
                cur.execute('UPDATE notifications SET read = true WHERE id = %s AND user_id = %s', (notif_id, user_id))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
