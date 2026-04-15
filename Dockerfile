# Use official Python runtime as base image
FROM python:3.10-slim

# Set environment variables to avoid python writing .pyc files and buffer issues
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (Tesseract OCR & Poppler)
RUN apt-get update -qq && apt-get install -y -qq \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the entire project
COPY . /app/

# We'll run the app from the backend directory using Gunicorn
WORKDIR /app/backend

# Use shell form of CMD so that $PORT is evaluated properly by Render
CMD gunicorn app:app --bind 0.0.0.0:$PORT
