import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update security.py to add hash_token and verify_token_hash
    if 'security.py' in filepath:
        if 'def hash_token' not in content:
            import_hashlib = 'import hashlib\n'
            if 'import hashlib' not in content:
                content = import_hashlib + content
            
            token_funcs = """
def hash_token(token: str) -> str:
    \"\"\"Hash a long token (like JWT) bypassing bcrypt 72-byte limit.\"\"\"
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def verify_token_hash(token: str, hashed: str) -> bool:
    \"\"\"Verify a SHA-256 hashed token.\"\"\"
    return hash_token(token) == hashed
"""
            content = content + '\n' + token_funcs

    # 2. Update files that import hash_password to also import hash_token (and verify_token_hash)
    if 'hash_password' in content and ('password_reset_token' in content or 'activation_token' in content):
        if 'hash_token' not in content:
            content = content.replace('hash_password', 'hash_password, hash_token, verify_token_hash')
            content = content.replace('hash_password, hash_token, verify_token_hash,', 'hash_password, hash_token, verify_token_hash,') # cleanup
            
            # 3. Replace hash_password(raw_token) with hash_token(raw_token)
            content = re.sub(r'hash_password\((raw_token|activation_token)\)', r'hash_token(\1)', content)
            
            # 4. Replace verify_password(token, ...) with verify_token_hash(token, ...)
            content = re.sub(r'verify_password\(([^,]+),\s*([^)]+password_reset_token[^)]*)\)', r'verify_token_hash(\1, \2)', content)
            content = re.sub(r'verify_password\(([^,]+),\s*([^)]+activation_token[^)]*)\)', r'verify_token_hash(\1, \2)', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\Users\Jonathan Ndayele\Desktop\smart_attendance_system\smart-attendance-backend\app"
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.py'):
            fix_file(os.path.join(root, file))
print("Patched tokens successfully!")
