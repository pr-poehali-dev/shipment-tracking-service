"""Уведомления. action: list | mark_read | mark_all_read."""
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


def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data)}


def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg})}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    if not token:
        return err('Не авторизован', 401)

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'list')

    try:
        conn = get_conn()
    except Exception as e:
        return err(f'DB error: {e}', 500)

    cur = conn.cursor()
    try:
        cur.execute('SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()', (token,))
        row = cur.fetchone()
        if not row:
            return err('Сессия истекла', 401)
        user_id = row[0]

        # LIST
        if action == 'list':
            cur.execute('''
                SELECT id, text, type, read, created_at FROM notifications
                WHERE user_id = %s ORDER BY created_at DESC LIMIT 50
            ''', (user_id,))
            rows = cur.fetchall()
            notifs = [{
                'id': r[0], 'text': r[1], 'type': r[2],
                'read': r[3], 'created_at': r[4].isoformat() if r[4] else ''
            } for r in rows]
            cur.execute('SELECT COUNT(*) FROM notifications WHERE user_id = %s AND read = false', (user_id,))
            unread = cur.fetchone()[0]
            return ok({'notifications': notifs, 'unread_count': unread})

        # MARK ALL READ
        if action == 'mark_all_read':
            cur.execute('UPDATE notifications SET read = true WHERE user_id = %s', (user_id,))
            conn.commit()
            return ok({'ok': True})

        # MARK ONE READ
        if action == 'mark_read':
            notif_id = body.get('id')
            if notif_id:
                cur.execute(
                    'UPDATE notifications SET read = true WHERE id = %s AND user_id = %s',
                    (notif_id, user_id)
                )
                conn.commit()
            return ok({'ok': True})

        return err('Unknown action')

    finally:
        cur.close()
        conn.close()
