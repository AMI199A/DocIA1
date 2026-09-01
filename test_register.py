from fastapi.testclient import TestClient
from main import app
from services.database import Base, engine

# Ensure tables are created
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test_register@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    print("Response status:", response.status_code)
    print("Response body:", response.json())
    if response.status_code in (200, 201):
        print("Éxito: El registro funciona correctamente (200/201).")
    else:
        print("Fallo: El registro no devolvió 200/201.")

if __name__ == "__main__":
    test_register_user()
