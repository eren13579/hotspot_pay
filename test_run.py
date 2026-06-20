import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        r = await client.get('/health')
        print(f'1. Health -> {r.status_code}')

        r = await client.post('/api/v1/router/actions/create',
            json={'hotspotId': 'x', 'actionType': 'CREATE_USER', 'username': 'u', 'password': 'p'})
        print(f'2. SANS cle -> {r.status_code} | {r.text[:120]}')

        r = await client.post('/api/v1/router/actions/create',
            headers={'x-api-key': 'dev-api-key-change-in-production'},
            json={'hotspotId': 'x', 'actionType': 'CREATE_USER', 'username': 'u', 'password': 'p'})
        print(f'3. AVEC cle -> {r.status_code} | {r.text[:120]}')

asyncio.run(test())
