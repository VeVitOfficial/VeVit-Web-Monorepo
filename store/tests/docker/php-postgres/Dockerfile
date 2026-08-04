FROM php:8.3-cli
RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql pcntl \
    && rm -rf /var/lib/apt/lists/*
