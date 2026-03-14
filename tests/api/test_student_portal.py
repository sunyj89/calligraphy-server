from sqlalchemy import select

from app.models import Book, Student


async def login_student(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "111111"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_student_can_view_and_update_profile(client):
    token = await login_student(client)
    me = await client.get("/api/student/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["phone"] == "13700000000"
    assert "address" in me.json()
    assert "updated_at" in me.json()
    assert "is_active" in me.json()

    update = await client.put(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "New Name", "school": "Calligraphy School", "address": "Room 201"},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "New Name"
    assert update.json()["address"] == "Room 201"


async def test_student_change_password_flow(client):
    token = await login_student(client)
    changed = await client.put(
        "/api/student/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"old_password": "111111", "new_password": "11111199"},
    )
    assert changed.status_code == 200

    new_login = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "11111199"},
    )
    assert new_login.status_code == 200


async def test_student_can_list_scores_and_works(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    book = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().first()

    add_practice = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 50,
            "term": "spring",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "lesson",
        },
    )
    assert add_practice.status_code == 200

    add_work = await client.post(
        f"/api/students/{student.id}/works",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "term": "spring",
            "slot_index": 1,
            "gallery_scope": "classroom",
            "image_url": "/uploads/demo.jpg",
            "description": "demo",
            "score": 88,
        },
    )
    assert add_work.status_code == 200

    student_token = await login_student(client)
    scores_resp = await client.get(
        "/api/student/scores?term=spring",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert scores_resp.status_code == 200
    assert scores_resp.json()["total"] >= 1

    works_resp = await client.get(
        "/api/student/works?term=spring",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert works_resp.status_code == 200
    assert works_resp.json()["total"] >= 1


async def test_student_books_and_leaderboards_expose_contract_fields(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    books = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().all()

    score_resp = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 20,
            "term": "spring",
            "target_part": "root",
            "book_id": str(books[0].id),
            "reason": "bookshelf",
        },
    )
    assert score_resp.status_code == 200

    work_resp = await client.post(
        f"/api/students/{student.id}/works",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "term": "spring",
            "slot_index": 2,
            "gallery_scope": "school",
            "image_url": "/uploads/bookshelf.jpg",
            "description": "bookshelf work",
            "score": 91,
        },
    )
    assert work_resp.status_code == 200

    student_token = await login_student(client)
    books_resp = await client.get(
        "/api/student/books",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert books_resp.status_code == 200
    book_items = books_resp.json()["items"]
    assert len(book_items) >= 2
    lit_book = next(item for item in book_items if item["id"] == str(books[0].id))
    unlit_book = next(item for item in book_items if item["id"] == str(books[1].id))
    assert lit_book["is_lit"] is False
    assert lit_book["lit_score"] == 20
    assert unlit_book["is_lit"] is False

    my_scores = await client.get(
        "/api/student/scores?term=spring",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert my_scores.status_code == 200
    score_types = {item["score_type"] for item in my_scores.json()["items"]}
    assert {"practice", "work"}.issubset(score_types)

    classroom_board = await client.get(
        "/api/student/leaderboard/classroom",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert classroom_board.status_code == 200
    assert classroom_board.json()
    first_classroom_entry = classroom_board.json()[0]
    assert {"rank", "id", "name", "total_score", "stage", "is_senior", "classroom_id"}.issubset(
        first_classroom_entry.keys()
    )

    school_board = await client.get(
        "/api/student/leaderboard/school",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert school_board.status_code == 200
    first_school_entry = school_board.json()[0]
    assert {"rank", "id", "name", "total_score", "stage", "is_senior", "classroom_id"}.issubset(
        first_school_entry.keys()
    )


async def test_bookshelf_requires_single_practice_score_at_least_50_to_light(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    extra_books = [
        Book(name="Book Three", order_num=3, description="Third"),
        Book(name="Book Four", order_num=4, description="Fourth"),
    ]
    db.add_all(extra_books)
    await db.commit()
    books = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().all()

    low_score_payloads = [
        {
            "score_type": "practice",
            "score": 5,
            "term": "spring",
            "target_part": "root",
            "book_id": str(books[0].id),
            "reason": "only-5",
        },
        {
            "score_type": "practice",
            "score": 20,
            "term": "spring",
            "target_part": "root",
            "book_id": str(books[1].id),
            "reason": "only-20",
        },
        {
            "score_type": "practice",
            "score": 50,
            "term": "spring",
            "target_part": "root",
            "book_id": str(books[2].id),
            "reason": "exact-50",
        },
        {
            "score_type": "practice",
            "score": 70,
            "term": "spring",
            "target_part": "root",
            "book_id": str(books[3].id),
            "reason": "exact-70",
        },
    ]

    for payload in low_score_payloads:
        response = await client.post(
            f"/api/students/{student.id}/scores",
            headers={"Authorization": f"Bearer {teacher_token}"},
            json=payload,
        )
        assert response.status_code == 200

    student_token = await login_student(client)
    books_resp = await client.get(
        "/api/student/books",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert books_resp.status_code == 200
    items = {item["id"]: item for item in books_resp.json()["items"]}

    assert items[str(books[0].id)]["is_lit"] is False
    assert items[str(books[0].id)]["lit_score"] == 5
    assert items[str(books[1].id)]["is_lit"] is False
    assert items[str(books[1].id)]["lit_score"] == 20
    assert items[str(books[2].id)]["is_lit"] is True
    assert items[str(books[2].id)]["lit_score"] == 50
    assert items[str(books[3].id)]["is_lit"] is True
    assert items[str(books[3].id)]["lit_score"] == 70


async def test_bookshelf_uses_history_max_single_score_not_latest_snapshot(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    book = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().first()

    first = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 50,
            "term": "spring",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "first-pass",
        },
    )
    assert first.status_code == 200

    second = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 20,
            "term": "spring",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "overwrite-lower",
        },
    )
    assert second.status_code == 200

    student_token = await login_student(client)
    books_resp = await client.get(
        "/api/student/books",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert books_resp.status_code == 200
    item = next(book_item for book_item in books_resp.json()["items"] if book_item["id"] == str(book.id))

    assert item["is_lit"] is True
    assert item["lit_score"] == 50


async def test_bookshelf_is_term_aware_for_cross_term_scores(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    book = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().first()

    spring = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 50,
            "term": "spring",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "spring-pass",
        },
    )
    assert spring.status_code == 200

    summer = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 20,
            "term": "summer",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "summer-fail",
        },
    )
    assert summer.status_code == 200

    student_token = await login_student(client)
    spring_books = await client.get(
        "/api/student/books?term=spring",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert spring_books.status_code == 200
    spring_item = next(item for item in spring_books.json()["items"] if item["id"] == str(book.id))
    assert spring_item["is_lit"] is True
    assert spring_item["lit_score"] == 50

    summer_books = await client.get(
        "/api/student/books?term=summer",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert summer_books.status_code == 200
    summer_item = next(item for item in summer_books.json()["items"] if item["id"] == str(book.id))
    assert summer_item["is_lit"] is False
    assert summer_item["lit_score"] == 20


async def test_bookshelf_default_term_uses_backend_current_term(client, db, monkeypatch):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    book = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().first()

    spring = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 20,
            "term": "spring",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "spring-low",
        },
    )
    assert spring.status_code == 200

    autumn = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 70,
            "term": "autumn",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "autumn-pass",
        },
    )
    assert autumn.status_code == 200

    from app.services import book_service

    monkeypatch.setattr(book_service, "get_current_term", lambda: "autumn")

    student_token = await login_student(client)
    books_resp = await client.get(
        "/api/student/books",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert books_resp.status_code == 200
    item = next(book_item for book_item in books_resp.json()["items"] if book_item["id"] == str(book.id))
    assert item["is_lit"] is True
    assert item["lit_score"] == 70
