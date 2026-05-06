"""CRUD операции для отгрузок."""
import json
import os
from datetime import datetime
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p68201465_shipment_tracking_se')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')


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

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    if not token:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_row = get_user(cur, token)
        if not user_row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

        user_id, user_role = user_row

        # GET /  — список всех отгрузок
        if method == 'GET':
            cur.execute('''
                SELECT s.id, s.shipment_number, s.destination, s.driver, s.weight, s.comment,
                       s.created_at, s.shipped_at, u.full_name as creator
                FROM shipments s
                LEFT JOIN users u ON u.id = s.created_by
                ORDER BY s.created_at DESC
            ''')
            rows = cur.fetchall()
            result = []
            for r in rows:
                result.append({
                    'id': r[0],
                    'shipment_number': r[1],
                    'destination': r[2],
                    'driver': r[3] or '',
                    'weight': r[4] or '',
                    'comment': r[5] or '',
                    'created_at': r[6].isoformat() if r[6] else '',
                    'shipped_at': r[7].isoformat() if r[7] else '',
                    'creator': r[8] or '',
                    'status': 'Отгружен'
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'shipments': result})}

        # POST / — создать отгрузку
        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            destination = body.get('destination', '').strip()
            driver = body.get('driver', '').strip()
            weight = body.get('weight', '').strip()
            comment = body.get('comment', '').strip()

            if not destination:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите пункт назначения'})}

            cur.execute("SELECT COUNT(*) FROM shipments")
            count = cur.fetchone()[0]
            shipment_number = f'А-{(count + 1):04d}'

            cur.execute('''
                INSERT INTO shipments (shipment_number, destination, driver, weight, comment, created_by)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, shipment_number
            ''', (shipment_number, destination, driver or None, weight or None, comment or None, user_id))
            row = cur.fetchone()

            cur.execute('''
                INSERT INTO notifications (user_id, text, type)
                VALUES (%s, %s, 'success')
            ''', (user_id, f'Отгрузка {shipment_number} создана и отгружена'))
            conn.commit()

            return {
                'statusCode': 200, 'headers': CORS,
                'body': json.dumps({'id': row[0], 'shipment_number': row[1], 'ok': True})
            }

        # PUT /<id> — редактировать
        if method == 'PUT':
            parts = path.rstrip('/').split('/')
            ship_id = int(parts[-1]) if parts[-1].isdigit() else None
            if not ship_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите ID'})}

            body = json.loads(event.get('body') or '{}')
            destination = body.get('destination', '').strip()
            driver = body.get('driver', '').strip()
            weight = body.get('weight', '').strip()
            comment = body.get('comment', '').strip()

            cur.execute('''
                UPDATE shipments SET destination=%s, driver=%s, weight=%s, comment=%s
                WHERE id=%s
            ''', (destination or None, driver or None, weight or None, comment or None, ship_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
