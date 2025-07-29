#!/bin/bash

echo "🚀 BuyBox Bot Lite - Deployment Script"
echo "======================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please initialize git first:"
    echo "   git init"
    echo "   git remote add origin <your-repo-url>"
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Your commit message'"
    exit 1
fi

echo "✅ Git repository is clean"

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo "✅ Frontend built successfully"

# Commit the build
echo "📝 Committing build files..."
git add .
git commit -m "Build for production deployment"

# Push to remote
echo "🚀 Pushing to remote repository..."
git push origin main

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app"
echo "2. Create a new project"
echo "3. Connect your GitHub repository"
echo "4. Add environment variables (see DEPLOYMENT.md)"
echo "5. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 