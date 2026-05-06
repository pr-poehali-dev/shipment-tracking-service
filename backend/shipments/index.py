"""CRUD отгрузок. action: list | create | update."""
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


def get_user(cur, token: str):
    cur.execute('''
        SELECT u.id, u.role FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    ''', (token,))
    return cur.fetchone()


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
        user_row = get_user(cur, token)
        if not user_row:
            return err('Сессия истекла', 401)

        user_id, user_role = user_row

        # LIST
        if action == 'list':
            cur.execute('''
                SELECT s.id, s.shipment_number, s.destination, s.driver, s.weight, s.comment,
                       s.created_at, s.shipped_at, u.full_name
                FROM shipments s
                LEFT JOIN users u ON u.id = s.created_by
                ORDER BY s.created_at DESC
            ''')
            rows = cur.fetchall()
            result = [{
                'id': r[0], 'shipment_number': r[1], 'destination': r[2],
                'driver': r[3] or '', 'weight': r[4] or '', 'comment': r[5] or '',
                'created_at': r[6].isoformat() if r[6] else '',
                'shipped_at': r[7].isoformat() if r[7] else '',
                'creator': r[8] or '', 'status': 'Отгружен'
            } for r in rows]
            return ok({'shipments': result})

        # CREATE
        if action == 'create':
            destination = body.get('destination', '').strip()
            driver = body.get('driver', '').strip()
            weight = body.get('weight', '').strip()
            comment = body.get('comment', '').strip()
            if not destination:
                return err('Укажите пункт назначения')
            cur.execute('SELECT COUNT(*) FROM shipments')
            count = cur.fetchone()[0]
            shipment_number = f'А-{(count + 1):04d}'
            cur.execute('''
                INSERT INTO shipments (shipment_number, destination, driver, weight, comment, created_by)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, shipment_number
            ''', (shipment_number, destination, driver or None, weight or None, comment or None, user_id))
            row = cur.fetchone()
            cur.execute(
                'INSERT INTO notifications (user_id, text, type) VALUES (%s, %s, %s)',
                (user_id, f'Отгрузка {shipment_number} создана и отгружена', 'success')
            )
            conn.commit()
            return ok({'id': row[0], 'shipment_number': row[1], 'ok': True})

        # UPDATE
        if action == 'update':
            ship_id = body.get('id')
            if not ship_id:
                return err('Укажите ID')
            destination = body.get('destination', '').strip()
            driver = body.get('driver', '').strip()
            weight = body.get('weight', '').strip()
            comment = body.get('comment', '').strip()
            cur.execute('''
                UPDATE shipments SET destination=%s, driver=%s, weight=%s, comment=%s WHERE id=%s
            ''', (destination or None, driver or None, weight or None, comment or None, ship_id))
            conn.commit()
            return ok({'ok': True})

        return err('Unknown action')

    finally:
        cur.close()
        conn.close()
