"""
Test script to verify AutoSRS setup and configuration.
Run this before starting the main application.
"""

import os
import sys
from pathlib import Path
import subprocess
import shutil

def test_env_file():
    """Check if .env file exists and has required keys"""
    print("🔍 Checking .env file...")
    
    if not Path(".env").exists():
        print("❌ .env file not found!")
        print("   Create .env file and add your API keys.")
        return False
    
    # Check for required environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL")
    
    if not groq_key:
        print("❌ GROQ_API_KEY not found in .env file!")
        return False
    
    if not groq_model:
        print("❌ GROQ_MODEL not found in .env file!")
        return False
    
    print(f"✅ .env file configured correctly")
    print(f"   Model: {groq_model}")
    return True

def test_python_packages():
    """Check if all required Python packages are installed"""
    print("\n🔍 Checking Python packages...")
    
    required_packages = [
        "google.adk",
        "litellm",
        "pydantic",
        "fastapi",
        "uvicorn",
        "jinja2",
        "docx",
        "dotenv"
    ]
    
    missing = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} - NOT INSTALLED")
            missing.append(package)
    
    if missing:
        print("\n❌ Missing packages detected!")
        print("   Run: pip install -r requirements.txt")
        return False
    
    print("✅ All Python packages installed")
    return True

def test_mmdc():
    """Check if mermaid-cli (mmdc) is installed"""
    print("\n🔍 Checking Mermaid CLI (mmdc)...")
    
    # Check common Windows locations
    possible_paths = [
        "C:\\Users\\ASUS\\AppData\\Roaming\\npm\\mmdc.cmd",
        shutil.which("mmdc"),
        shutil.which("mmdc.cmd")
    ]
    
    for path in possible_paths:
        if path and Path(path).exists() if isinstance(path, str) else path:
            print(f"✅ mmdc found at: {path}")
            
            # Try to get version
            try:
                result = subprocess.run(
                    [str(path), "--version"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    print(f"   Version: {result.stdout.strip()}")
                return True
            except Exception as e:
                print(f"   ⚠️  Found but couldn't verify: {e}")
                return True
    
    print("❌ mmdc (Mermaid CLI) not found!")
    print("   Install with: npm install -g @mermaid-js/mermaid-cli")
    return False

def test_directories():
    """Check if required directories exist"""
    print("\n🔍 Checking project directories...")
    
    required_dirs = [
        "srs_engine/static",
        "srs_engine/templates",
        "srs_engine/agents",
        "srs_engine/utils",
        "srs_engine/schemas"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"   ✅ {dir_path}")
        else:
            print(f"   ❌ {dir_path} - NOT FOUND")
            all_exist = False
    
    if all_exist:
        print("✅ All directories present")
    else:
        print("❌ Some directories missing!")
    
    return all_exist

def test_model_import():
    """Test if the model can be imported"""
    print("\n🔍 Testing model configuration...")
    
    try:
        from srs_engine.utils.model import groq_llm, GROQ_MODEL
        print(f"✅ Model loaded successfully")
        print(f"   Using model: {GROQ_MODEL}")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 AutoSRS Setup Verification")
    print("=" * 60)
    
    tests = [
        ("Environment File", test_env_file),
        ("Python Packages", test_python_packages),
        ("Mermaid CLI", test_mmdc),
        ("Project Directories", test_directories),
        ("Model Configuration", test_model_import)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} test failed with error: {e}")
            results[test_name] = False
    
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if not result:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All tests passed! You're ready to run AutoSRS.")
        print("   Start the server with: uvicorn srs_engine.main:app --reload")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
