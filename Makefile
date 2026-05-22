.PHONY: test test-be test-fe test-be-coverage test-fe-coverage coverage test-coverage ci ci-be ci-fe ci-agent ci-dashboard

# Run all tests (backend + frontend)
test: test-be test-fe

# Run all tests with coverage report (backend + frontend)
coverage: test-be-coverage test-fe-coverage

test-coverage: coverage


# Backend — pytest (agent/)
test-be:
	cd agent && pytest

# Frontend — Jest (dashboard/)
test-fe:
	cd dashboard && npm run test:coverage -- --watchAll=false

# Backend with coverage report
test-be-coverage:
	cd agent && pytest --cov=core --cov=clients --cov=models --cov=main --cov-report=term-missing

# Frontend with coverage report
test-fe-coverage:
	cd dashboard && npm run test:coverage

# Run CI checks (linting, typechecking, tests, and build) for both agent and dashboard
ci: ci-be ci-fe

ci-be: ci-agent
ci-agent:
	cd agent && .venv/bin/ruff check .
	cd agent && .venv/bin/mypy .
	$(MAKE) test-be-coverage

ci-fe: ci-dashboard
ci-dashboard:
	cd dashboard && npm run ci
	cd dashboard && npm run build

# Run both backend and frontend development servers in parallel
dev:
	@echo "Starting backend agent (port 8000) and frontend dashboard (port 3000)..."
	@npx -y concurrently \
		--names "AGENT,DASHBOARD" \
		--prefix-colors "cyan,magenta" \
		--kill-others \
		"cd agent && .venv/bin/uvicorn main:app --reload --port 8000" \
		"cd dashboard && npm run dev"
