#!/bin/bash

# Variables
REPO_URL="https://github.com/content-services/content-sources-backend.git"
BRANCH="main"
FOLDER_PATH="API"
LOCAL_DIR="tests"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)

# Remove the existing folder in the local directory if it exists
rm -rf $LOCAL_DIR/$FOLDER_PATH

# Clone the specific branch
git clone --branch $BRANCH $REPO_URL $TEMP_DIR

# Copy the specific folder to the local directory
cp -r $TEMP_DIR/_playwright-tests/tests/$FOLDER_PATH $LOCAL_DIR


cp -r $TEMP_DIR/_playwright-tests/test-utils/ ./

# Clean up the temporary directory
rm -rf $TEMP_DIR

echo "Folder copied to $LOCAL_DIR/$FOLDER_PATH"
