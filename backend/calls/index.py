"""Управление звонками: создать инвайт, получить статус, обновить статус"""
import json
import os
import secrets
import psycopg2
from datetime import datetime


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user(cur, token):
    cur.execute("SELECT id, user_number, name FROM users WHERE session_token = %s", (token,))
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')
    token = event.get('headers', {}).get('x-session-token') or event.get('headers', {}).get('X-Session-Token', '')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}

    conn = get_conn()
    cur = conn.cursor()
    try:
        if path.endswith('/join'):
            invite_token = params.get('token')
            cur.execute("SELECT id, caller_id, status FROM calls WHERE invite_token = %s", (invite_token,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Звонок не найден'})}
            cur.execute("SELECT name, user_number FROM users WHERE id = %s", (row[1],))
            caller = cur.fetchone()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'call_id': row[0], 'status': row[2], 'caller_name': caller[0], 'caller_number': caller[1]})}

        user = get_user(cur, token)
        if not user:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
        user_id = user[0]

        if method == 'POST' and path.endswith('/invite'):
            invite_token = secrets.token_urlsafe(32)
            cur.execute("INSERT INTO calls (caller_id, invite_token, status) VALUES (%s, %s, 'pending') RETURNING id", (user_id, invite_token))
            call_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'call_id': call_id, 'invite_token': invite_token})}

        elif method == 'POST' and path.endswith('/start'):
            body = json.loads(event.get('body') or '{}')
            callee_id = body.get('callee_id')
            invite_token = secrets.token_urlsafe(32)
            cur.execute("INSERT INTO calls (caller_id, callee_id, invite_token, status, started_at) VALUES (%s, %s, %s, 'active', NOW()) RETURNING id", (user_id, callee_id, invite_token))
            call_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'call_id': call_id, 'invite_token': invite_token})}

        elif method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            call_id = body.get('call_id')
            new_status = body.get('status')
            if new_status == 'active':
                cur.execute("UPDATE calls SET status = 'active', started_at = NOW() WHERE id = %s", (call_id,))
            elif new_status in ('ended', 'rejected'):
                cur.execute("UPDATE calls SET status = %s, ended_at = NOW() WHERE id = %s", (new_status, call_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        elif method == 'GET':
            cur.execute("""
                SELECT c.id, c.caller_id, c.callee_id, c.status, c.started_at, c.ended_at, c.invite_token,
                       u.name as caller_name, u.user_number as caller_number
                FROM calls c
                JOIN users u ON u.id = c.caller_id
                WHERE (c.caller_id = %s OR c.callee_id = %s)
                ORDER BY c.created_at DESC LIMIT 50
            """, (user_id, user_id))
            rows = cur.fetchall()
            call_list = [{
                'id': r[0], 'caller_id': r[1], 'callee_id': r[2], 'status': r[3],
                'started_at': r[4].isoformat() if r[4] else None,
                'ended_at': r[5].isoformat() if r[5] else None,
                'invite_token': r[6], 'caller_name': r[7], 'caller_number': r[8]
            } for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'calls': call_list})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
    finally:
        cur.close()
        conn.close()
