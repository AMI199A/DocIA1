import argparse
import sys
from services.database import SessionLocal
from services.models import User, UserRole

def make_admin(identifier: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == identifier) | (User.email == identifier)
        ).first()
        if not user:
            print(f"Error: El usuario '{identifier}' no fue encontrado en la base de datos.")
            sys.exit(1)
        
        user.role = UserRole.admin.value
        db.commit()
        print(f"Éxito: El usuario '{user.username}' ahora tiene el rol 'admin'.")
    except Exception as e:
        print(f"Error inesperado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gestor de roles de usuario para DocIA")
    parser.add_argument("usuario", nargs="?", help="Username o correo electrónico del usuario")
    
    args = parser.parse_args()
    usuario = args.usuario
    if not usuario:
        try:
            usuario = input("Por favor ingresa el username o correo del usuario a hacer admin: ").strip()
        except EOFError:
            pass
        
    if not usuario:
        print("Error: No se proporcionó un usuario.")
        sys.exit(1)
        
    make_admin(usuario)
