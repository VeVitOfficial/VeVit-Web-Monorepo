-- VeVit Edu platform schema
-- MariaDB 10.4 compatible, phpMyAdmin style (no DELIMITER)
-- Charset: utf8 / utf8_czech_ci, no FOREIGN KEY constraints

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(60) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
    xp_reward INT DEFAULT 500,
    thumbnail_color VARCHAR(20),
    thumbnail_icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    lesson_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_czech_ci;

CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT,
    lesson_type ENUM('lesson','quiz','final_quiz') DEFAULT 'lesson',
    sort_order INT DEFAULT 0,
    xp_reward INT DEFAULT 10,
    duration_minutes INT DEFAULT 15,
    video_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_czech_ci;

CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer CHAR(1) NOT NULL,
    explanation TEXT,
    sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_czech_ci;

CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    lesson_id INT NOT NULL,
    course_id INT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    xp_ziskano INT DEFAULT 0,
    skore INT NULL,
    UNIQUE KEY unique_progress (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_czech_ci;