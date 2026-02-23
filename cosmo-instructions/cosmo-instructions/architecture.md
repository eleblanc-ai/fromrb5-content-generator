# Architecture Guidelines

> **Note:** These are universal architectural principles that apply to any project. Your `cosmo-instructions/spec.md` contains project-specific rules (language, framework, folder structure, etc.).

## Table of Contents
1. [Core Principles](#core-principles) - Buckets, boundaries, Rule of Three
2. [Directory Structure](#directory-structure) - Folder organization options
3. [Feature Organization](#feature-organization) - Small, medium, large features
4. [Shared Code Organization](#shared-code-organization) - When and how to share
5. [Module Boundaries](#module-boundaries) - Public APIs and encapsulation
6. [Configuration](#configuration) - Centralization and management
7. [Definition of Done](#definition-of-done) - Quality checklist
8. [Phase-Specific Guidance](#phase-specific-guidance) - What to check in each phase
9. [Dependencies](#dependencies) - Adding and managing dependencies
10. [Testing Structure](#testing-structure) - Test organization
11. [File Naming](#file-naming) - Naming conventions
12. [Flexibility](#flexibility) - When to adapt
13. [Project-Specific Rules](#project-specific-rules) - What goes in spec.md

---

## Core Principles

### 1. Separation of Concerns (Buckets)

Your project should be organized into distinct buckets:

- **Features**: User-facing capabilities ("user can ___")
- **Shared**: Reusable building blocks used by 2+ places
- **App/Core**: Application shell (entry point, routing, global config, providers)

**Placement Rules:**
- **If used by 1 feature**: Keep it inside that feature folder
- **If used by 2+ features**: Promote to shared
- **App-level concerns**: Place in app/core bucket
- **Do not create new top-level buckets** without discussing with user

### 2. Import Boundaries (Critical)

These rules prevent tight coupling and maintain clean architecture:

- ❌ **Features MUST NOT import from other features**
- ✅ Features MAY import from: Shared, App/Core
- ✅ Shared MAY import from: Shared, App/Core
- ✅ App/Core MAY import from: Shared, Features
- ❌ **Shared MUST NOT import from Features**

**Why this matters:**
- Prevents circular dependencies
- Makes features independently testable
- Allows features to be extracted/replaced/deleted easily
- Improves build times and code organization

**How to verify:** Your spec.md should include a command to check for violations (e.g., grep/search for cross-feature imports).

### 3. Rule of Three (Avoid Premature Abstraction)

Only create abstractions after writing similar code **3 times**.
- First time: Write it inline
- Second time: Copy it (yes, duplicate!)
- Third time: Now extract to shared

**Code Organization Principles:**
- **Colocation**: Keep related code together
- **Wait for patterns to emerge**: Don't abstract until you see actual duplication
- **Minimal abstractions**: Only abstract when there's real duplication, not hypothetical future reuse

Premature abstraction is worse than duplication.

---

## Directory Structure

### Option 1: Feature-First (Small to Medium Projects)
```
src/
├── features/           # Feature modules
│   ├── user-auth/
│   ├── product-catalog/
│   └── checkout/
├── shared/            # Shared code
│   ├── utils/
│   ├── components/
│   └── models/
└── app/               # Application root
    ├── config/
    └── main.*
```

### Option 2: Layer-First (Larger Projects, Clear Separation)
```
src/
├── domain/            # Business logic (pure)
├── application/       # Use cases, orchestration
├── infrastructure/    # External integrations
├── presentation/      # UI layer
└── main.*            # Entry point
```

### Option 3: Hybrid (Flexible, Medium to Large)
```
src/
├── features/
│   ├── feature-a/
│   └── feature-b/
├── core/              # Essential shared code
├── lib/               # Optional shared code
└── app/
```

**Choose based on your project.** Specify your choice in `spec.md`.

---

## Feature Organization

Each feature should be **self-contained** with its own internal structure.

### Small Feature (Single Directory)
```
features/user-auth/
├── auth-service.*
├── auth-validator.*
├── login-handler.*
└── auth.test.*
```

### Medium Feature (Organized Subdirectories)
```
features/user-auth/
├── handlers/          # Request/event handlers
├── services/          # Business logic
├── models/            # Data structures
├── utils/             # Feature-specific helpers
└── tests/
```

### Large Feature (Mini-Application)
```
features/product-catalog/
├── products/          # Sub-feature
│   ├── services/
│   ├── models/
│   └── tests/
├── categories/        # Sub-feature
├── inventory/         # Sub-feature
├── shared/            # Shared within feature
└── index.*           # Feature public API
```

**Guidelines:**
- Start simple, add structure as complexity grows
- Avoid creating empty folders "just in case"
- Group by **function**, not by file type (unless specified in spec)

---

## Shared Code Organization

### By Purpose (Recommended for Most Projects)
```
shared/
├── utils/             # Pure functions, helpers
├── validation/        # Common validators
├── models/            # Shared data structures
├── constants/         # Configuration, enums
└── types/             # Type definitions (if applicable)
```

### By Domain (For Complex Business Logic)
```
shared/
├── payment/           # Payment-related shared logic
├── notification/      # Notification utilities
├── auth/              # Auth helpers
└── data/              # Data access, persistence
```

**When to share:**
- Used by 2+ features (Rule of Three doesn't apply to obvious candidates)
- Contains business logic central to the application
- Utilities with clear, narrow purpose

**When NOT to share:**
- Only one feature uses it (keep it in the feature)
- Premature "this might be useful later"
- Tightly coupled to a specific feature's internals

---

## Module Boundaries

### Public APIs
Each feature should expose a **clean public interface**.

**Bad:**
```
// Other features import internal implementation
import { getUserById } from 'features/users/services/user-service'
```

**Good:**
```
// Feature exposes public API
// features/users/index.*
export { getUser, createUser, deleteUser }

// Other code imports from feature root
import { getUser } from 'features/users'
```

### Private Implementation
Keep internal details private. Only export what others need.

---

## Configuration

### Centralization Principle
- **Centralize config**: All configuration should live in one known location
- **Single source of truth**: Don't scatter config across the codebase
- **Document defaults**: Each config option needs a default value and documentation
- **Environment variables**: Use for environment-specific overrides (dev, test, prod)

### Placement
- **Project-wide config**: In designated config directory (e.g., `config/`, `app/config/`)
- **Feature-specific config**: Inside the feature directory (if it's truly feature-specific)
- **Never hardcode**: URLs, API keys, paths, timeouts, limits

### Adding New Configuration
When adding new config:
1. Add default value
2. Document what it does and valid values
3. Add to centralized config location
4. Add test coverage if behavior changes based on config

### Rules
- ❌ No hardcoded values in code (URLs, API keys, paths)
- ✅ Single source of truth for configuration
- ✅ Environment-specific overrides (dev, test, prod)
- ✅ Fail fast on missing required config

---

## Definition of Done

Before marking any work complete, verify ALL of these:

### Code Quality
- ✓ **Minimal diff** - No unrelated refactors or changes
- ✓ **No unused code** - No unused exports, imports, functions, or variables
- ✓ **Code follows existing patterns** - Consistent with codebase style and conventions
- ✓ **Functions within limits** - ≤50 lines, cyclomatic complexity ≤8
- ✓ **Clear naming** - Descriptive names that reduce need for comments

### Architecture
- ✓ **Architecture boundaries respected** - No forbidden imports (check with verification command)
- ✓ **Correct file placement** - Code in appropriate bucket (features/shared/app)
- ✓ **No new top-level buckets** - Only approved top-level directories exist
- ✓ **Config centralized** - No scattered configuration

### Testing
- ✓ **Tests exist** - All new functionality has test coverage
- ✓ **Tests pass** - All existing and new tests passing
- ✓ **Complete workflows tested** - Not just isolated operations

### Documentation
- ✓ **Docs updated** - If behavior, config, or API changed
- ✓ **Comments where needed** - Only where logic isn't self-evident

### Verification
- ✓ **Verification passes** - Project's verification command succeeds
- ✓ **No type errors** - (if language has static typing)
- ✓ **Lint passes** - (if project uses linting)

**If any criterion fails, the work is not complete.**

---

## Phase-Specific Guidance

### When Planning (Phase 2)

Before presenting a plan, consider:
- Does the file placement follow bucket rules?
- Are any imports crossing forbidden boundaries?
- If creating shared code, is it actually used by 2+ places?
- Does this maintain or improve the architecture?
- Is new configuration properly centralized?

If uncertain, note in "Risks/Open decisions" and discuss with user.

### When Implementing (Phase 3)

Follow this checklist:
1. Read `cosmo-instructions/architecture.md` (this file) - Universal principles
2. Read `cosmo-instructions/spec.md` Architecture section - Project-specific rules
3. Read relevant existing code - Understand patterns
4. Place files according to bucket rules
5. Respect import boundaries (run check command from spec.md)
6. Centralize any new configuration
7. Follow existing code patterns and style
8. Verify Definition of Done before proceeding to Phase 4

### When Reviewing (Phase 4)

Check ALL of these before presenting to user:
1. **Run import boundary check** (command from spec.md)
2. **Verify file placement**: Is code in the right bucket?
3. **Check for new top-level buckets**: Should only have approved directories
4. **Config centralization**: Is config in one place?
5. **Definition of Done**: All items verified?
6. **Diff review**: Only changes related to approved plan?

**Architecture violations = review failure. Fix before presenting to user.**

---

## Dependencies

### Adding Dependencies
- **Always document why** in your slice plan
- Consider: size, maintenance status, security, alternatives
- Prefer standard library when sufficient
- Each dependency is attack surface + maintenance burden

### Managing Dependencies
- Pin versions (avoid `*` or overly broad ranges)
- Regular security updates
- Remove unused dependencies immediately

---

## Testing Structure

### Test Location Options

**Option 1: Collocated (Simple Projects)**
```
features/user-auth/
├── auth-service.*
├── auth-service.test.*    # Test next to source
└── login-handler.test.*
```

**Option 2: Test Directory (Larger Projects)**
```
features/user-auth/
├── src/
│   ├── auth-service.*
│   └── login-handler.*
└── tests/
    ├── auth-service.test.*
    └── login-handler.test.*
```

**Specify your preference in `spec.md`.**

### Test Organization
- **Unit tests**: Test individual functions/modules
- **Integration tests**: Test feature workflows
- **End-to-end tests**: Test full user journeys

Match your project's conventions.

---

## File Naming

### Be Consistent
Choose one convention and stick to it across the codebase:
- `kebab-case.ext` (user-service.js)
- `snake_case.ext` (user_service.py)
- `PascalCase.ext` (UserService.java)
- `camelCase.ext` (userService.ts)

Follow your language's/framework's conventions.

### File Type Indicators
Use suffixes to indicate file purpose:
- `.test.*` - Tests
- `.spec.*` - Specifications (if different from tests)
- `.config.*` - Configuration
- `.mock.*` - Test mocks/fixtures

---

## Code Organization Within Files

### Size Guidelines
- **Functions/Methods**: ≤ 50 lines
- **Files**: ≤ 500 lines (break into multiple files if larger)
- **Cyclomatic complexity**: ≤ 8 per function

### Structure
1. Imports (external, then internal)
2. Type definitions (if applicable)
3. Constants
4. Helper functions (private)
5. Main exports (public API)

---

## Flexibility

**These are guidelines, not rigid rules.**

- Start simple, add structure as needed
- If the existing codebase differs, **match it** (consistency > perfection)
- Document deviations in `spec.md` with reasoning
- Refactor when patterns become clear, not before

---

## Project-Specific Rules

**IMPORTANT:** This file contains universal architectural principles that apply to any project.

**Your project MUST define these in `cosmo-instructions/spec.md` Architecture section:**

1. **Language/Framework**: What you're building with (Python/Django, JavaScript/React, Go, etc.)
2. **Folder Structure**: Which bucket pattern you're using and exact directory names
3. **Naming Conventions**: File and folder naming rules (kebab-case, snake_case, PascalCase, etc.)
4. **Build/Test Commands**: How to verify code works (e.g., `npm run verify`, `make test`, `cargo test`)
5. **Import Boundary Check Command**: Command to verify no forbidden imports
6. **Style Guidelines**: Formatting, linting rules, styling approach
7. **Testing Framework**: What tools/libraries to use for testing
8. **Configuration Location**: Where config files live in your project

**Example spec.md Architecture section:**
```markdown
## Architecture

**Language/Framework:** React 18 + TypeScript + Vite
**Folder Structure:** 3-bucket pattern (src/features, src/shared, src/app)
**Naming:** kebab-case for files, PascalCase for React components
**Verification:** `npm run verify` (runs type-check, lint, and tests)
**Import Check:** `grep -r "from ['\"].*features/" src/features/`
**Styling:** Tailwind CSS utility classes only (no CSS modules or styled-components)
**Testing:** Vitest + React Testing Library, collocated *.test.tsx files
**Config:** Centralized in src/shared/config/
```

---

**This architecture.md file is the single source of truth for universal architecture rules.**

When architecture principles change, update this file.
When project-specific details change, update `spec.md`.
