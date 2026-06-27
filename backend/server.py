from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import csv
import io
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Stripe setup
stripe_api_key = os.getenv('STRIPE_API_KEY', 'sk_test_emergent')

# ============= STAFF CONFIGURATION =============
# Add emails here to automatically assign roles on registration/login
# Role options: "employee" (Pracownik), "admin" (Pracodawca)
STAFF_ROLES: Dict[str, str] = {
    "admin@miedzywierszami.pl": "admin",
    # Examples - add real staff emails here:
    # "pracodawca@miedzywierszami.pl": "admin",
    # "pracownik1@miedzywierszami.pl": "employee",
    # "pracownik2@miedzywierszami.pl": "employee",
    "test.pracownik@miedzywierszami.pl": "employee",
    "test.pracodawca@miedzywierszami.pl": "admin",
}


def get_role_for_email(email: str) -> str:
    """Returns the role for a given email - admin/employee if in STAFF_ROLES, else customer"""
    return STAFF_ROLES.get(email.lower().strip(), "customer")


# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "customer"  # customer, employee, admin
    created_at: datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Book(BaseModel):
    model_config = ConfigDict(extra="ignore")
    book_id: str
    title: str
    author: str
    description: str
    price: float
    image_url: str
    stock: int = 10
    created_at: datetime

class BookCreate(BaseModel):
    title: str
    author: str
    description: str
    price: float
    image_url: str
    stock: int = 10

class CartItem(BaseModel):
    book_id: str
    quantity: int

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    user_id: str
    items: List[Dict[str, Any]]
    total: float
    status: str
    payment_session_id: Optional[str] = None
    created_at: datetime

class Schedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schedule_id: str
    user_id: str
    user_name: str
    date: str
    shift_start: str
    shift_end: str
    notes: Optional[str] = None
    created_at: datetime

class ScheduleCreate(BaseModel):
    user_id: str
    user_name: str
    date: str
    shift_start: str
    shift_end: str
    notes: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    user_id: str
    user_name: str
    message: str
    created_at: datetime

class ChatMessageCreate(BaseModel):
    message: str

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    announcement_id: str
    title: str
    content: str
    created_by: str
    created_at: datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str

# ============= AUTH HELPERS =============

async def get_current_user(request: Request) -> Optional[User]:
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    user = await require_auth(request)
    if user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(data.password)
    
    # Create user - auto-assign role from STAFF_ROLES config
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password": hashed_password,
        "role": get_role_for_email(data.email),
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    return {"message": "Registration successful", "user_id": user_id}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    # Find user
    user_doc = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not pwd_context.verify(data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Auto-update role if email is in STAFF_ROLES config (allows promoting users via code)
    expected_role = get_role_for_email(data.email)
    if expected_role != "customer" and user_doc.get("role") != expected_role:
        await db.users.update_one({"email": data.email}, {"$set": {"role": expected_role}})
        user_doc["role"] = expected_role
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc.pop("password", None)
    return User(**user_doc)

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# Google OAuth endpoints
@api_router.post("/auth/google/session")
async def google_oauth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        user_data = resp.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if not user_doc:
        # Create new user - auto-assign role from STAFF_ROLES config
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": get_role_for_email(user_data["email"]),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    else:
        # Update existing user + auto-update role if in STAFF_ROLES
        expected_role = get_role_for_email(user_data["email"])
        update_set = {
            "name": user_data["name"],
            "picture": user_data.get("picture")
        }
        if expected_role != "customer" and user_doc.get("role") != expected_role:
            update_set["role"] = expected_role
            user_doc["role"] = expected_role
        await db.users.update_one(
            {"email": user_data["email"]},
            {"$set": update_set}
        )
        user_doc["name"] = user_data["name"]
        user_doc["picture"] = user_data.get("picture")
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc.pop("password", None)
    return User(**user_doc)

# ============= BOOKS ENDPOINTS =============

@api_router.get("/books", response_model=List[Book])
async def get_books():
    books = await db.books.find({}, {"_id": 0}).to_list(1000)
    for book in books:
        if isinstance(book['created_at'], str):
            book['created_at'] = datetime.fromisoformat(book['created_at'])
    return books

@api_router.get("/books/{book_id}", response_model=Book)
async def get_book(book_id: str):
    book = await db.books.find_one({"book_id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if isinstance(book['created_at'], str):
        book['created_at'] = datetime.fromisoformat(book['created_at'])
    return Book(**book)

@api_router.post("/books", response_model=Book)
async def create_book(book_data: BookCreate, user: User = Depends(require_admin)):
    book_id = f"book_{uuid.uuid4().hex[:12]}"
    book_doc = book_data.model_dump()
    book_doc["book_id"] = book_id
    book_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.books.insert_one(book_doc)
    
    book_doc['created_at'] = datetime.fromisoformat(book_doc['created_at'])
    return Book(**book_doc)

@api_router.put("/books/{book_id}", response_model=Book)
async def update_book(book_id: str, book_data: BookCreate, user: User = Depends(require_admin)):
    result = await db.books.update_one(
        {"book_id": book_id},
        {"$set": book_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    
    book = await db.books.find_one({"book_id": book_id}, {"_id": 0})
    if isinstance(book['created_at'], str):
        book['created_at'] = datetime.fromisoformat(book['created_at'])
    return Book(**book)

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str, user: User = Depends(require_admin)):
    result = await db.books.delete_one({"book_id": book_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Book deleted successfully"}

@api_router.post("/books/upload-image")
async def upload_book_image(file: UploadFile = File(...), user: User = Depends(require_admin)):
    """Upload image file and return base64 data URL"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    encoded = base64.b64encode(contents).decode("utf-8")
    data_url = f"data:{file.content_type};base64,{encoded}"
    return {"image_url": data_url}

@api_router.post("/books/bulk-import")
async def bulk_import_books(request: Request, user: User = Depends(require_admin)):
    """Import multiple books from JSON or CSV"""
    content_type = request.headers.get("content-type", "")
    
    books_data = []
    
    if "application/json" in content_type:
        body = await request.json()
        # Accept either {"books": [...]} or [...]
        if isinstance(body, dict) and "books" in body:
            books_data = body["books"]
        elif isinstance(body, list):
            books_data = body
        else:
            raise HTTPException(status_code=400, detail="Invalid JSON format")
    else:
        # Try CSV parsing
        body = await request.body()
        text = body.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        books_data = list(reader)
    
    if not books_data:
        raise HTTPException(status_code=400, detail="No books to import")
    
    created = []
    errors = []
    
    for idx, book in enumerate(books_data):
        try:
            # Required fields
            if not book.get("title") or not book.get("author"):
                errors.append({"row": idx + 1, "error": "Missing title or author"})
                continue
            
            book_doc = {
                "book_id": f"book_{uuid.uuid4().hex[:12]}",
                "title": str(book.get("title", "")).strip(),
                "author": str(book.get("author", "")).strip(),
                "description": str(book.get("description", "")).strip(),
                "price": float(book.get("price", 0)),
                "image_url": str(book.get("image_url", "")).strip() or "https://images.unsplash.com/photo-1519764340700-3db40311f21e?w=400",
                "stock": int(book.get("stock", 10)),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.books.insert_one(book_doc)
            created.append(book_doc["title"])
        except (ValueError, TypeError) as e:
            errors.append({"row": idx + 1, "error": str(e)})
    
    return {
        "created_count": len(created),
        "error_count": len(errors),
        "created_titles": created,
        "errors": errors
    }

# ============= ORDERS & CART =============

@api_router.post("/orders")
async def create_order(items: List[CartItem], user: User = Depends(require_auth)):
    # Calculate total and get book details
    total = 0.0
    order_items = []
    
    for item in items:
        book = await db.books.find_one({"book_id": item.book_id}, {"_id": 0})
        if not book:
            raise HTTPException(status_code=404, detail=f"Book {item.book_id} not found")
        
        if book["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {book['title']}")
        
        item_total = book["price"] * item.quantity
        total += item_total
        
        order_items.append({
            "book_id": item.book_id,
            "title": book["title"],
            "price": book["price"],
            "quantity": item.quantity,
            "subtotal": item_total
        })
    
    # Create order
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    order_doc = {
        "order_id": order_id,
        "user_id": user.user_id,
        "items": order_items,
        "total": total,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    return {"order_id": order_id, "total": total}

@api_router.get("/orders", response_model=List[Order])
async def get_orders(user: User = Depends(require_auth)):
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.get("/orders/all", response_model=List[Order])
async def get_all_orders(user: User = Depends(require_admin)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

# ============= PAYMENT =============

@api_router.post("/payment/checkout")
async def create_checkout(request: Request, user: User = Depends(require_auth)):
    body = await request.json()
    order_id = body.get("order_id")
    origin_url = body.get("origin_url")
    
    if not order_id or not origin_url:
        raise HTTPException(status_code=400, detail="order_id and origin_url required")
    
    # Get order
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create Stripe checkout
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/cart"
    
    checkout_request = CheckoutSessionRequest(
        amount=order["total"],
        currency="pln",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "user_id": user.user_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "order_id": order_id,
        "user_id": user.user_id,
        "amount": order["total"],
        "currency": "pln",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, user: User = Depends(require_auth)):
    webhook_url = "https://placeholder.com/webhook"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "payment_status": status.payment_status,
            "status": status.status
        }}
    )
    
    # If paid, update order status
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction:
            await db.orders.update_one(
                {"order_id": transaction["order_id"]},
                {"$set": {"status": "paid"}}
            )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = "https://placeholder.com/webhook"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"session_id": event.session_id},
            {"$set": {
                "payment_status": event.payment_status,
                "event_type": event.event_type
            }}
        )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============= ADMIN: SCHEDULE =============

@api_router.get("/schedule", response_model=List[Schedule])
async def get_schedule(user: User = Depends(require_auth)):
    if user.role == "admin":
        schedules = await db.schedules.find({}, {"_id": 0}).to_list(1000)
    else:
        schedules = await db.schedules.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    for schedule in schedules:
        if isinstance(schedule['created_at'], str):
            schedule['created_at'] = datetime.fromisoformat(schedule['created_at'])
    return schedules

@api_router.post("/schedule", response_model=Schedule)
async def create_schedule(schedule_data: ScheduleCreate, user: User = Depends(require_admin)):
    schedule_id = f"schedule_{uuid.uuid4().hex[:12]}"
    schedule_doc = schedule_data.model_dump()
    schedule_doc["schedule_id"] = schedule_id
    schedule_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.schedules.insert_one(schedule_doc)
    
    schedule_doc['created_at'] = datetime.fromisoformat(schedule_doc['created_at'])
    return Schedule(**schedule_doc)

@api_router.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str, user: User = Depends(require_admin)):
    result = await db.schedules.delete_one({"schedule_id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}

# ============= ADMIN: CHAT =============

@api_router.get("/chat", response_model=List[ChatMessage])
async def get_chat_messages(user: User = Depends(require_auth)):
    if user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    for msg in messages:
        if isinstance(msg['created_at'], str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    return messages

@api_router.post("/chat", response_model=ChatMessage)
async def send_chat_message(message_data: ChatMessageCreate, user: User = Depends(require_auth)):
    if user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message_doc = {
        "message_id": message_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "message": message_data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chat_messages.insert_one(message_doc)
    
    message_doc['created_at'] = datetime.fromisoformat(message_doc['created_at'])
    return ChatMessage(**message_doc)

# ============= ADMIN: ANNOUNCEMENTS =============

@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements(user: User = Depends(require_auth)):
    if user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for ann in announcements:
        if isinstance(ann['created_at'], str):
            ann['created_at'] = datetime.fromisoformat(ann['created_at'])
    return announcements

@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(announcement_data: AnnouncementCreate, user: User = Depends(require_admin)):
    announcement_id = f"ann_{uuid.uuid4().hex[:12]}"
    announcement_doc = {
        "announcement_id": announcement_id,
        "title": announcement_data.title,
        "content": announcement_data.content,
        "created_by": user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.announcements.insert_one(announcement_doc)
    
    announcement_doc['created_at'] = datetime.fromisoformat(announcement_doc['created_at'])
    return Announcement(**announcement_doc)

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, user: User = Depends(require_admin)):
    result = await db.announcements.delete_one({"announcement_id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted successfully"}

# ============= ADMIN: USERS =============

@api_router.get("/users", response_model=List[User])
async def get_users(user: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if isinstance(u['created_at'], str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    return users

@api_router.get("/staff/config")
async def get_staff_config(user: User = Depends(require_admin)):
    """View pre-configured staff emails (from code)"""
    return {"staff_roles": STAFF_ROLES}

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, current_user: User = Depends(require_admin)):
    if role not in ["customer", "employee", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
