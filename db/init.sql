-- Скрипт виконується лише один раз - під час першого створення порожнього тому з даними.
CREATE TABLE links (
    code       VARCHAR(32)  PRIMARY KEY,
    url        TEXT         NOT NULL,
    clicks     INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT links_code_format  CHECK (code ~ '^[A-Za-z0-9_-]{3,32}$'),
    CONSTRAINT links_url_length   CHECK (char_length(url) <= 2048),
    CONSTRAINT links_clicks_check CHECK (clicks >= 0)
);
