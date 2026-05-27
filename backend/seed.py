"""Seed initial admin user and sample books"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def seed():
    # Admin user
    admin_email = "admin@miedzywierszami.pl"
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email,
            "name": "Administrator",
            "password": pwd_context.hash("Admin123!"),
            "role": "admin",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"Created admin: {admin_email} / Admin123!")
    else:
        # Update existing user to admin role
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"role": "admin"}}
        )
        print(f"Admin exists: {admin_email}")

    # Test user
    test_email = "test@example.com"
    existing = await db.users.find_one({"email": test_email})
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": test_email,
            "name": "Test User",
            "password": pwd_context.hash("Test123!"),
            "role": "customer",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"Created test user: {test_email} / Test123!")

    # Sample books
    sample_books = [
        {
            "title": "Mała Książka o Kawie",
            "author": "Anna Kowalska",
            "description": "Przewodnik dla miłośników kawy - od ziarna do filiżanki. Odkryj sekrety parzenia idealnej kawy w domu i poznaj historię tego niezwykłego napoju.",
            "price": 49.90,
            "image_url": "https://images.unsplash.com/photo-1519764340700-3db40311f21e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBsaXRlcmF0dXJlJTIwbWluaW1hbGlzdHxlbnwwfHx8fDE3Nzk4OTgwMTB8MA&ixlib=rb-4.1.0&q=85",
            "stock": 15
        },
        {
            "title": "Między Wierszami",
            "author": "Maria Nowak",
            "description": "Powieść o magicznym miejscu, gdzie książki spotykają się z kawą, a obcy stają się przyjaciółmi. Opowieść inspirowana naszą kawiarnią.",
            "price": 39.90,
            "image_url": "https://images.unsplash.com/photo-1716892001555-c05f13f4362a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHxib29rJTIwY292ZXIlMjBsaXRlcmF0dXJlJTIwbWluaW1hbGlzdHxlbnwwfHx8fDE3Nzk4OTgwMTB8MA&ixlib=rb-4.1.0&q=85",
            "stock": 20
        },
        {
            "title": "Smaki Szczecina",
            "author": "Piotr Wiśniewski",
            "description": "Kulinarna podróż po Szczecinie. Najlepsze miejsca, lokalne przysmaki i historie kryjące się za każdym daniem.",
            "price": 55.00,
            "image_url": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
            "stock": 12
        },
        {
            "title": "Sztuka Latte Art",
            "author": "Tomasz Kowal",
            "description": "Naucz się tworzyć piękne wzory na kawie. Krok po kroku przewodnik dla początkujących baristów.",
            "price": 65.00,
            "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
            "stock": 8
        },
        {
            "title": "Poezja Codzienności",
            "author": "Katarzyna Dąb",
            "description": "Zbiór wierszy o zwykłych chwilach, które stają się niezwykłe. Idealna lektura przy filiżance kawy.",
            "price": 32.00,
            "image_url": "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=800",
            "stock": 25
        },
        {
            "title": "Kawiarnia Marzeń",
            "author": "Agnieszka Maj",
            "description": "Opowieść o kobiecie, która zostawia karierę w korporacji, by otworzyć kawiarnię swoich marzeń.",
            "price": 42.50,
            "image_url": "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800",
            "stock": 18
        }
    ]

    count = await db.books.count_documents({})
    if count == 0:
        for book in sample_books:
            await db.books.insert_one({
                "book_id": f"book_{uuid.uuid4().hex[:12]}",
                **book,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        print(f"Created {len(sample_books)} sample books")
    else:
        print(f"Books already exist: {count}")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
