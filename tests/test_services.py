import pytest
from database import Base, engine, SessionLocal
import services
from auth import register_user, authenticate_user

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_public_requisitions_list(setup_db):
    db = setup_db
    reqs = services.get_public_requisitions(db)
    assert isinstance(reqs, list)

def test_auth_workflow(setup_db):
    db = setup_db
    user, err = register_user(db, "Test", "User", "test.user@example.com", "Password123", "+91 99999 88888")
    if err and "already registered" in err:
        user, err = authenticate_user(db, "test.user@example.com", "Password123")
    assert user is not None

def test_admin_grid(setup_db):
    db = setup_db
    grid = services.get_admin_applications_grid(db)
    assert isinstance(grid, list)
