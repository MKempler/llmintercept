from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="aifirewall",
    version="1.0.0",
    author="AI Prompt Firewall",
    author_email="support@aifirewall.com",
    description="Security layer for LLM interactions - blocks secrets, PII, and prompt injection attacks",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/aifirewall",
    packages=find_packages(exclude=["tests", "gateway", "detection", "policy", "audit_logging"]),
    package_dir={"": "."},
    py_modules=[],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Security",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "openai>=1.3.0",
        "httpx>=0.25.0",
    ],
    extras_require={
        "anthropic": ["anthropic>=0.18.0"],
        "google": ["google-generativeai>=0.3.0"],
    },
    entry_points={
        "console_scripts": [],
    },
)
