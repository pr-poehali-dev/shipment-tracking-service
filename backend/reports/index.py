"""Отчёты по отгрузкам."""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p68201465_shipment_tracking_se')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    if not token:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    try:
        conn = get_conn()
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'DB error: {e}'})}

    cur = conn.cursor()

    try:
        cur.execute('SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()', (token,))
        if not cur.fetchone():
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

        # По месяцам (текущий год)
        cur.execute("""
            SELECT
                TO_CHAR(created_at, 'YYYY-MM') as month,
                TO_CHAR(created_at, 'Mon') as month_name,
                COUNT(*) as count
            FROM shipments
            WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
            GROUP BY month, month_name
            ORDER BY month
        """)
        monthly = cur.fetchall()

        months_map = {
            'Jan': 'Янв', 'Feb': 'Фев', 'Mar': 'Мар', 'Apr': 'Апр',
            'May': 'Май', 'Jun': 'Июн', 'Jul': 'Июл', 'Aug': 'Авг',
            'Sep': 'Сен', 'Oct': 'Окт', 'Nov': 'Ноя', 'Dec': 'Дек'
        }

        monthly_data = []
        for r in monthly:
            monthly_data.append({
                'month': months_map.get(r[1], r[1]),
                'count': r[2]
            })

        # Всего
        cur.execute('SELECT COUNT(*) FROM shipments')
        total = cur.fetchone()[0]

        # За текущий месяц
        cur.execute("""
            SELECT COUNT(*) FROM shipments
            WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
        """)
        this_month = cur.fetchone()[0]

        # За сегодня
        cur.execute("SELECT COUNT(*) FROM shipments WHERE DATE(created_at) = CURRENT_DATE")
        today = cur.fetchone()[0]

        # По водителям топ-5
        cur.execute("""
            SELECT driver, COUNT(*) as cnt
            FROM shipments
            WHERE driver IS NOT NULL AND driver != ''
            GROUP BY driver
            ORDER BY cnt DESC
            LIMIT 5
        """)
        drivers = [{'driver': r[0], 'count': r[1]} for r in cur.fetchall()]

        return {
            'statusCode': 200, 'headers': CORS,
            'body': json.dumps({
                'monthly': monthly_data,
                'total': total,
                'this_month': this_month,
                'today': today,
                'top_drivers': drivers
            })
        }

    finally:
        cur.close()
        conn.close()