#!/bin/bash

# Ensure we are in the project root
# Re-generate prisma client just in case
npx prisma generate

# Git operations
git add .
git commit -m "Fix stock-in: add purchase cost, enable supplier, and resolve duplicate egg types"
git push origin main

echo "Changes pushed to GitHub. Render should start the deployment automatically."
