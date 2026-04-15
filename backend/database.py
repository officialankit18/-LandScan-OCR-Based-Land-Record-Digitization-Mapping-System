import sqlite3
from datetime import datetime
from config import DATABASE_PATH


def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS land_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_name TEXT,
            plot_number TEXT,
            latitude REAL,
            longitude REAL,
            file_name TEXT,
            raw_text TEXT,
            ocr_time REAL,
            processing_time REAL,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()


def insert_record(owner_name, plot_number, latitude, longitude, file_name, raw_text, ocr_time, processing_time):
    conn = get_connection()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor = conn.execute("""
        INSERT INTO land_records (owner_name, plot_number, latitude, longitude, file_name, raw_text, ocr_time, processing_time, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (owner_name, plot_number, latitude, longitude, file_name, raw_text, ocr_time, processing_time, timestamp))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id


def get_all_records():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM land_records ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_record_by_id(record_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM land_records WHERE id = ?", (record_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_record(record_id):
    conn = get_connection()
    conn.execute("DELETE FROM land_records WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
