"""Setup script for development."""
import subprocess
import sys
import os


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False


def main():
    """Main setup function."""
    print("AI Prompt Firewall - Setup")
    print("=" * 50)
    
    # Install Python dependencies
    if not run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        "Installing Python dependencies"
    ):
        return False
    
    # Download spaCy model for PII detection
    if not run_command(
        f"{sys.executable} -m spacy download en_core_web_sm",
        "Downloading spaCy model"
    ):
        print("⚠️  Warning: Could not download spaCy model. PII detection may not work.")
    
    # Install Node dependencies for dashboard
    if os.path.exists("dashboard"):
        if not run_command(
            "cd dashboard && npm install",
            "Installing Node.js dependencies"
        ):
            return False
    
    print("\n" + "=" * 50)
    print("✅ Setup complete!")
    print("\nNext steps:")
    print("1. Set OPENAI_API_KEY environment variable")
    print("2. Run gateway: python -m gateway.server")
    print("3. Run dashboard: cd dashboard && npm run dev")
    print("4. Run demo: python demo.py")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

