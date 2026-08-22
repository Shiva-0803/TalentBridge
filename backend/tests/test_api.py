import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.models.domain import User, JobRequisition

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_public_job_listing():
    response = client.get("/api/requisitions/public")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "job_title" in data[0]
        assert "requisition_id" in data[0]

def test_public_filters():
    response = client.get("/api/requisitions/public/filters")
    assert response.status_code == 200
    data = response.json()
    assert "departments" in data
    assert "locations" in data
    assert "experiences" in data

def test_auth_and_protected_flow():
    # Login with admin credentials
    login_res = client.post("/api/auth/login", json={
        "email": "admin@talentbridge.com",
        "password": "Admin@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Fetch admin requisitions
    headers = {"Authorization": f"Bearer {token}"}
    admin_reqs = client.get("/api/requisitions/admin/all", headers=headers)
    assert admin_reqs.status_code == 200
    assert len(admin_reqs.json()) > 0
