# docker/python/Dockerfile
FROM python:3.12-alpine
RUN adduser -D sanboxuser
USER sanboxuser
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1