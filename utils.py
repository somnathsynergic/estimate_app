import bcrypt

def get_hashed_password(password: str) -> str:
    # Convert the password string to bytes
    password_bytes = password.encode('utf-8')
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return the hashed password as a string
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_pass: str) -> bool:
    try:
        # Convert strings to bytes
        password_bytes = password.encode('utf-8')
        hashed_bytes = hashed_pass.encode('utf-8')
        # Verify the password
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        # Return False if there's any error in verification
        return False