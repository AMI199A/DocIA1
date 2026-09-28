import sqlite3
email = input('Ingresa tu email registrado: ')
conn = sqlite3.connect('docia.db')
cursor = conn.cursor()
cursor.execute('UPDATE users SET role=? WHERE email=?', ('admin', email))
conn.commit()
if cursor.rowcount > 0:
    print('¡Exito! Rol cambiado a admin.')
else:
    print('No se encontro ningun usuario con ese email.')
conn.close()
