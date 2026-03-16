with open('db_load_error.log', 'rb') as f:
    text = f.read().decode('utf-16le').replace('\r', '').replace('\n\n', '\n')
with open('trace.txt', 'w', encoding='utf-8') as out:
    out.write(text[-2000:])
