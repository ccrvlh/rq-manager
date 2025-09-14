# Contributing to RQ Manager

Thank you for your interest in contributing to RQ Manager! This guide will help you get started with development and contributing to the project.

## 🔧 Development

### Project Structure

```
rq-manager/
├── api/                    # Python backend
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── schemas/       # Data models
│   │   └── cli/           # CLI commands
│   └── pyproject.toml     # Python dependencies
├── front/                 # React frontend
│   ├── src/
│   │   ├── pages/         # UI pages
│   │   ├── services/      # API clients
│   │   └── utils/         # Utilities
│   └── package.json       # Node dependencies
├── infra/                 # Infrastructure
│   ├── k8s/              # Kubernetes manifests
│   └── nginx/            # Nginx configuration
└── docs/                 # Documentation
```

### Local Development Setup

#### Backend Setup

```bash
# Navigate to API directory
cd api

# Install Poetry (if not already installed)
pip install poetry

# Install dependencies
poetry install

# Copy and configure environment
cp ../.env.example .env
# Edit .env with your configuration

# Run the API server
poetry run rqm api --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd front

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env.local
# Edit .env.local with your API endpoint

# Start development server
yarn dev
```

## Performance Considerations

- Profile code changes for performance impact
- Use appropriate data structures and algorithms
- Consider memory usage for large datasets
- Optimize database queries and Redis operations

## Security Guidelines

- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries for database operations
- Follow OWASP security guidelines
- Review dependencies for known vulnerabilities

## Documentation

- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update API documentation for endpoint changes
- Include examples in documentation

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/ccrvlh/rq-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ccrvlh/rq-manager/discussions)
- **Documentation**: [Wiki](https://github.com/ccrvlh/rq-manager/wiki)

## Release Process

1. Update version numbers in `pyproject.toml` and `package.json`
2. Update CHANGELOG.md with new features and fixes
3. Create a release branch
4. Run full test suite
5. Create a pull request for review
6. Tag the release after merge
