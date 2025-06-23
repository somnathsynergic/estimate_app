#!/bin/bash
# Build Lambda dependencies in Docker container

# Create package directory
rm -rf lambda_package
mkdir -p lambda_package

# Upgrade pip and install build tools
python -m pip install --upgrade pip
pip install wheel setuptools --upgrade

# Install dependencies with pip
pip install --upgrade pip wheel setuptools
pip install -r requirements.txt -t lambda_package

# Clean up unnecessary files to reduce package size
find lambda_package -type d -name "tests" -exec rm -rf {} +
find lambda_package -type d -name "__pycache__" -exec rm -rf {} +
find lambda_package -type f -name "*.pyc" -delete
find lambda_package -type f -name "*.pyo" -delete

# Copy application files
cp -r api lambda_package/
cp -r config lambda_package/
cp -r models lambda_package/
cp main.py lambda_package/
cp lambda_handler.py lambda_package/
cp utils.py lambda_package/

# Remove unnecessary files to reduce package size
find lambda_package -type d -name "__pycache__" -exec rm -rf {} +
find lambda_package -type d -name "*.dist-info" -exec rm -rf {} +
find lambda_package -type d -name "*.egg-info" -exec rm -rf {} +
find lambda_package -type f -name "*.pyc" -delete
find lambda_package -type f -name "*.pyo" -delete

# Fix file permissions
chmod -R 755 lambda_package
