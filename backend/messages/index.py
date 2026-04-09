"""Отправка и получение сообщений между пользователями"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user(cur, token):
    cur.execute("SELECT id FROM users WHERE session_token = %s", (token,))
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')
    token = event.get('headers', {}).get('x-session-token') or event.get('headers', {}).get('X-Session-Token', '')
    params = event.get('queryStringParameters') or {}

    conn = get_conn()
    cur = conn.cursor()
    try:
        user = get_user(cur, token)
        if not user:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
        user_id = user[0]

        if method == 'GET':
            other_id = params.get('with')
            if not other_id:
                cur.execute("""
                    SELECT DISTINCT ON (partner_id)
                        partner_id,
                        content,
                        created_at,
                        sender_id,
                        is_read,
                        u.name,
                        u.user_number,
                        (SELECT COUNT(*) FROM messages m2 WHERE m2.sender_id = partner_id AND m2.receiver_id = %s AND m2.is_read = FALSE) as unread
                    FROM (
                        SELECT CASE WHEN sender_id = %s THEN receiver_id ELSE sender_id END as partner_id,
                               content, created_at, sender_id, is_read
                        FROM messages WHERE sender_id = %s OR receiver_id = %s
                        ORDER BY created_at DESC
                    ) t
                    JOIN users u ON u.id = t.partner_id
                    ORDER BY partner_id, created_at DESC
                """, (user_id, user_id, user_id, user_id))
                rows = cur.fetchall()
                chats = [{'partner_id': r[0], 'last_message': r[1], 'last_at': r[2].isoformat(), 'is_mine': r[3] == user_id, 'is_read': r[4], 'name': r[5], 'user_number': r[6], 'unread': r[7]} for r in rows]
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chats': chats})}
            else:
                cur.execute("""
                    SELECT id, sender_id, content, is_read, created_at
                    FROM messages
                    WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY created_at ASC
                """, (user_id, int(other_id), int(other_id), user_id))
                rows = cur.fetchall()
                cur.execute("UPDATE messages SET is_read = TRUE WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE", (int(other_id), user_id))
                conn.commit()
                msgs = [{'id': r[0], 'sender_id': r[1], 'content': r[2], 'is_read': r[3], 'created_at': r[4].isoformat()} for r in rows]
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': msgs})}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            receiver_id = body.get('receiver_id')
            content = body.get('content', '').strip()
            if not receiver_id or not content:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'receiver_id и content обязательны'})}
            cur.execute("INSERT INTO messages (sender_id, receiver_id, content) VALUES (%s, %s, %s) RETURNING id, created_at", (user_id, receiver_id, content))
            row = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': row[0], 'created_at': row[1].isoformat()})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
    finally:
        cur.close()
        conn.close()
