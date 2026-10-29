CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dob TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    blood_group TEXT,
    phone TEXT,
    email TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    emergency_contact TEXT,
    known_conditions TEXT,
    allergies TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
