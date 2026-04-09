"""Управление контактами: добавить, получить список"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user(cur, token):
    cur.execute("SELECT id, user_number, name FROM users WHERE session_token = %s", (token,))
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')
    token = event.get('headers', {}).get('x-session-token') or event.get('headers', {}).get('X-Session-Token', '')

    conn = get_conn()
    cur = conn.cursor()
    try:
        user = get_user(cur, token)
        if not user:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
        user_id = user[0]

        if method == 'GET':
            cur.execute("""
                SELECT c.id, c.alias, u.user_number, u.name, c.contact_user_id
                FROM contacts c
                JOIN users u ON u.id = c.contact_user_id
                WHERE c.owner_id = %s
                ORDER BY c.alias
            """, (user_id,))
            rows = cur.fetchall()
            contacts = [{'id': r[0], 'alias': r[1], 'user_number': r[2], 'name': r[3], 'contact_user_id': r[4]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'contacts': contacts})}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            contact_number = body.get('user_number')
            alias = body.get('alias', '').strip()
            if not contact_number or not alias:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Номер и название обязательны'})}

            cur.execute("SELECT id, name FROM users WHERE user_number = %s", (contact_number,))
            contact = cur.fetchone()
            if not contact:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Пользователь не найден'})}
            if contact[0] == user_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нельзя добавить себя'})}

            cur.execute(
                "INSERT INTO contacts (owner_id, contact_user_id, alias) VALUES (%s, %s, %s) ON CONFLICT (owner_id, contact_user_id) DO UPDATE SET alias = EXCLUDED.alias RETURNING id",
                (user_id, contact[0], alias)
            )
            cid = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': cid, 'alias': alias, 'user_number': contact_number, 'name': contact[1]})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
    finally:
        cur.close()
        conn.close()