ARG FRONTEND_ENV=docker

FROM python:3.12-slim AS api-build

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/api
COPY api/poetry.lock api/pyproject.toml ./
RUN pip install poetry
RUN poetry config virtualenvs.create false
RUN poetry install --without dev --no-cache --no-root
COPY api/ ./

FROM node:20-alpine AS frontend-build

ARG FRONTEND_ENV
WORKDIR /app/front
COPY front/package*.json ./
COPY front/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY front/ ./
COPY front/.env.${FRONTEND_ENV} .env
RUN yarn build

FROM python:3.12-slim AS production

RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=api-build /usr/local /usr/local
COPY --from=api-build /app/api /app/api
COPY --from=frontend-build /app/front/dist /usr/share/nginx/html
COPY infra/nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 7777

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7777/health || exit 1

CMD ["/startup.sh"]