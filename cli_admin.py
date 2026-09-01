import argparse
import sys
from services.database import SessionLocal
from services.models import User, UserRole

def make_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: El usuario con el correo '{email}' no fue encontrado.")
            sys.exit(1)
        
        user.role = UserRole.admin.value
        db.commit()
        print(f"Éxito: El usuario '{email}' ahora tiene el rol 'admin'.")
    except Exception as e:
        print(f"Error inesperado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gestor de roles de usuario para DocIA")
    parser.add_argument("email", nargs="?", help="Correo electrónico del usuario al que se le dará rol admin")
    
    args = parser.parse_args()
    
    email = args.email
    if not email:
        try:
            email = input("Por favor ingresa el correo del usuario a hacer admin: ").strip()
        except EOFError:
            pass
        
    if not email:
        print("Error: No se proporcionó un correo electrónico.")
        sys.exit(1)
        
    make_admin(email)
