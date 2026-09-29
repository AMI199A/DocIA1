import sqlite3
import os

identificador = input('Ingresa tu username o email registrado: ').strip()
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docia.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('UPDATE users SET role=? WHERE email=? OR username=?', ('admin', identificador, identificador))
conn.commit()
if cursor.rowcount > 0:
    print(f'¡Éxito! Rol de {identificador} cambiado a admin.')
else:
    print('No se encontró ningún usuario con ese username o email.')
conn.close()
