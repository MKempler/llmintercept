from setuptools import setup, find_packages

setup(
    name="aifirewall",
    version="0.1.0",
    description="AI Prompt Firewall - Security layer for LLM interactions",
    author="Your Name",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn[standard]>=0.24.0",
        "httpx>=0.25.0",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "python-multipart>=0.0.6",
        "detect-secrets>=1.4.0",
        "presidio-analyzer>=2.2.0",
        "presidio-anonymizer>=2.2.0",
        "spacy>=3.7.0",
        "openai>=1.3.0",
        "sqlalchemy>=2.0.23",
        "aiosqlite>=0.19.0",
    ],
    python_requires=">=3.11",
)
