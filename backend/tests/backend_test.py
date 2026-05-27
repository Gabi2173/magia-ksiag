"""
Backend API tests for Między Wierszami cafe/bookstore.
Covers: auth, books, orders, payment, schedule, chat, announcements, users.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://literary-cafe-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@miedzywierszami.pl"
ADMIN_PASSWORD = "Admin123!"
CUSTOMER_EMAIL = "test@example.com"
CUSTOMER_PASSWORD = "Test123!"


# -- shared session fixtures --
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    # session_token cookie
    return r.cookies.get("session_token")


@pytest.fixture(scope="session")
def customer_token():
    r = requests.post(f"{API}/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Customer login failed: {r.status_code} {r.text}")
    return r.cookies.get("session_token")


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# -- auth module --
class TestAuth:
    def test_register_and_login_new_user(self):
        unique = uuid.uuid4().hex[:8]
        email = f"TEST_user_{unique}@example.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Pass123!", "name": "Test New"})
        assert r.status_code == 200, r.text
        assert "user_id" in r.json()

        # login
        r2 = requests.post(f"{API}/auth/login", json={"email": email, "password": "Pass123!"})
        assert r2.status_code == 200, r2.text
        data = r2.json()
        assert data["email"] == email
        assert data["role"] == "customer"

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={"email": CUSTOMER_EMAIL, "password": "x", "name": "x"})
        assert r.status_code == 400

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nobody@test.com", "password": "x"})
        assert r.status_code == 401

    def test_me_with_bearer(self, customer_token):
        r = requests.get(f"{API}/auth/me", headers=auth_headers(customer_token))
        assert r.status_code == 200, r.text
        assert r.json()["email"] == CUSTOMER_EMAIL

    def test_me_unauthorized(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# -- books module --
class TestBooks:
    def test_list_books(self):
        r = requests.get(f"{API}/books")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # seeded

    def test_get_single_book(self):
        r = requests.get(f"{API}/books")
        book_id = r.json()[0]["book_id"]
        r2 = requests.get(f"{API}/books/{book_id}")
        assert r2.status_code == 200
        assert r2.json()["book_id"] == book_id

    def test_book_not_found(self):
        r = requests.get(f"{API}/books/nonexistent")
        assert r.status_code == 404

    def test_admin_create_update_delete_book(self, admin_token):
        payload = {
            "title": "TEST_Book", "author": "T Author",
            "description": "desc", "price": 29.99,
            "image_url": "https://example.com/x.jpg", "stock": 5
        }
        r = requests.post(f"{API}/books", json=payload, headers=auth_headers(admin_token))
        assert r.status_code == 200, r.text
        book = r.json()
        bid = book["book_id"]
        assert book["title"] == "TEST_Book"

        # update
        payload["title"] = "TEST_Book_Updated"
        r2 = requests.put(f"{API}/books/{bid}", json=payload, headers=auth_headers(admin_token))
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_Book_Updated"

        # verify via GET
        r3 = requests.get(f"{API}/books/{bid}")
        assert r3.json()["title"] == "TEST_Book_Updated"

        # delete
        r4 = requests.delete(f"{API}/books/{bid}", headers=auth_headers(admin_token))
        assert r4.status_code == 200
        # verify gone
        r5 = requests.get(f"{API}/books/{bid}")
        assert r5.status_code == 404

    def test_non_admin_cannot_create_book(self, customer_token):
        payload = {"title": "x", "author": "x", "description": "x", "price": 1.0, "image_url": "x", "stock": 1}
        r = requests.post(f"{API}/books", json=payload, headers=auth_headers(customer_token))
        assert r.status_code == 403


# -- orders module --
class TestOrders:
    def test_create_order_and_list(self, customer_token):
        # get a book
        books = requests.get(f"{API}/books").json()
        assert books
        book_id = books[0]["book_id"]
        items = [{"book_id": book_id, "quantity": 1}]
        r = requests.post(f"{API}/orders", json=items, headers=auth_headers(customer_token))
        assert r.status_code == 200, r.text
        data = r.json()
        assert "order_id" in data and "total" in data
        order_id = data["order_id"]

        # list own orders
        r2 = requests.get(f"{API}/orders", headers=auth_headers(customer_token))
        assert r2.status_code == 200
        order_ids = [o["order_id"] for o in r2.json()]
        assert order_id in order_ids

    def test_orders_require_auth(self):
        r = requests.post(f"{API}/orders", json=[])
        assert r.status_code == 401


# -- payment module --
class TestPayment:
    def test_payment_checkout_requires_auth(self):
        r = requests.post(f"{API}/payment/checkout", json={"order_id": "x", "origin_url": "https://x.com"})
        assert r.status_code == 401

    def test_payment_checkout_creates_session(self, customer_token):
        books = requests.get(f"{API}/books").json()
        book_id = books[0]["book_id"]
        r = requests.post(f"{API}/orders", json=[{"book_id": book_id, "quantity": 1}], headers=auth_headers(customer_token))
        order_id = r.json()["order_id"]

        r2 = requests.post(
            f"{API}/payment/checkout",
            json={"order_id": order_id, "origin_url": BASE_URL},
            headers=auth_headers(customer_token)
        )
        # Stripe call may take a couple seconds
        assert r2.status_code == 200, r2.text
        data = r2.json()
        assert "url" in data and data["url"].startswith("http")
        assert "session_id" in data


# -- announcements module --
class TestAnnouncements:
    def test_customer_cannot_read_announcements(self, customer_token):
        r = requests.get(f"{API}/announcements", headers=auth_headers(customer_token))
        assert r.status_code == 403

    def test_admin_can_create_list_delete_announcement(self, admin_token):
        r = requests.post(f"{API}/announcements", json={"title": "TEST_T", "content": "TEST_C"}, headers=auth_headers(admin_token))
        assert r.status_code == 200, r.text
        aid = r.json()["announcement_id"]

        r2 = requests.get(f"{API}/announcements", headers=auth_headers(admin_token))
        assert r2.status_code == 200
        assert any(a["announcement_id"] == aid for a in r2.json())

        r3 = requests.delete(f"{API}/announcements/{aid}", headers=auth_headers(admin_token))
        assert r3.status_code == 200


# -- schedule module --
class TestSchedule:
    def test_admin_create_and_delete_schedule(self, admin_token):
        # find admin user_id
        me = requests.get(f"{API}/auth/me", headers=auth_headers(admin_token)).json()
        payload = {
            "user_id": me["user_id"], "user_name": me["name"],
            "date": "2026-02-01", "shift_start": "09:00", "shift_end": "17:00", "notes": "TEST"
        }
        r = requests.post(f"{API}/schedule", json=payload, headers=auth_headers(admin_token))
        assert r.status_code == 200, r.text
        sid = r.json()["schedule_id"]

        r2 = requests.get(f"{API}/schedule", headers=auth_headers(admin_token))
        assert any(s["schedule_id"] == sid for s in r2.json())

        r3 = requests.delete(f"{API}/schedule/{sid}", headers=auth_headers(admin_token))
        assert r3.status_code == 200

    def test_customer_cannot_create_schedule(self, customer_token):
        payload = {"user_id": "x", "user_name": "x", "date": "2026-02-01", "shift_start": "09:00", "shift_end": "17:00"}
        r = requests.post(f"{API}/schedule", json=payload, headers=auth_headers(customer_token))
        assert r.status_code == 403


# -- chat module --
class TestChat:
    def test_admin_can_post_and_get_chat(self, admin_token):
        r = requests.post(f"{API}/chat", json={"message": "TEST hello"}, headers=auth_headers(admin_token))
        assert r.status_code == 200, r.text

        r2 = requests.get(f"{API}/chat", headers=auth_headers(admin_token))
        assert r2.status_code == 200
        assert any(m["message"] == "TEST hello" for m in r2.json())

    def test_customer_cannot_access_chat(self, customer_token):
        r = requests.get(f"{API}/chat", headers=auth_headers(customer_token))
        assert r.status_code == 403


# -- users admin module --
class TestUsersAdmin:
    def test_admin_list_users(self, admin_token):
        r = requests.get(f"{API}/users", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_customer_cannot_list_users(self, customer_token):
        r = requests.get(f"{API}/users", headers=auth_headers(customer_token))
        assert r.status_code == 403

    def test_update_user_role(self, admin_token):
        # create temp user
        unique = uuid.uuid4().hex[:8]
        email = f"TEST_role_{unique}@example.com"
        requests.post(f"{API}/auth/register", json={"email": email, "password": "P!", "name": "RoleUser"})
        users = requests.get(f"{API}/users", headers=auth_headers(admin_token)).json()
        u = next((x for x in users if x["email"] == email), None)
        assert u
        # update role
        r = requests.put(
            f"{API}/users/{u['user_id']}/role?role=employee",
            headers=auth_headers(admin_token)
        )
        assert r.status_code == 200, r.text
        users2 = requests.get(f"{API}/users", headers=auth_headers(admin_token)).json()
        u2 = next(x for x in users2 if x["email"] == email)
        assert u2["role"] == "employee"
